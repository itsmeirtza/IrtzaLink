import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as QRCode from 'qrcode';
import * as cors from 'cors';
import * as express from 'express';

admin.initializeApp();

const corsHandler = cors({ origin: true });
const app = express();
app.use(corsHandler);

// Verified users configuration (same as frontend)
const getVerifiedUsers = () => {
  return ['ialiwaris'];
};

const isVerifiedUser = (username: string): boolean => {
  if (!username) return false;
  return getVerifiedUsers().includes(username.toLowerCase());
};

// Generate QR Code for user profile
export const generateQRCode = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, username } = data;
  
  if (!userId || !username) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and username are required');
  }

  // Verify the user is requesting their own QR code
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Users can only generate their own QR codes');
  }

  try {
    const profileUrl = `https://${process.env.GCLOUD_PROJECT}.web.app/${username}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Save QR code info to user document
    await admin.firestore().collection('users').doc(userId).update({
      qrCodeURL: qrCodeDataUrl,
      profileURL: profileUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      qrCodeDataUrl,
      profileUrl
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate QR code');
  }
});

// Get user profile for public viewing
export const getProfile = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const username = req.path.split('/')[1] || req.query.username as string;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    try {
      // Find user by username
      const usersRef = admin.firestore().collection('users');
      const querySnapshot = await usersRef.where('username', '==', username).where('isActive', '==', true).get();
      
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Track profile visit
      await admin.firestore().collection('analytics').add({
        userId: userDoc.id,
        type: 'profile_visit',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userAgent: req.get('User-Agent') || '',
        ip: req.ip || req.connection.remoteAddress || ''
      });

      // Return public profile data
      const publicData = {
        username: userData.username,
        displayName: userData.displayName,
        bio: userData.bio,
        photoURL: userData.photoURL,
        socialLinks: userData.socialLinks || {},
        contactInfo: userData.contactInfo || {},
        theme: userData.theme || 'dark',
        profileURL: userData.profileURL
      };

      // Return HTML for direct browser visits
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        const html = generateProfileHTML(publicData);
        return res.setHeader('Content-Type', 'text/html').send(html);
      }

      // Return JSON for API calls
      return res.json({ success: true, profile: publicData });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Track QR code scans
export const trackQRScan = functions.https.onCall(async (data, context) => {
  const { userId, userAgent, source } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  try {
    await admin.firestore().collection('analytics').add({
      userId,
      type: 'qr_scan',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: userAgent || '',
      source: source || 'unknown'
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking QR scan:', error);
    throw new functions.https.HttpsError('internal', 'Failed to track QR scan');
  }
});

// Check username availability
export const checkUsernameAvailability = functions.https.onCall(async (data, context) => {
  const { username } = data;
  
  if (!username) {
    throw new functions.https.HttpsError('invalid-argument', 'Username is required');
  }

  // Check if username meets criteria (3-20 chars, alphanumeric + underscore)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return {
      available: false,
      reason: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
    };
  }

  try {
    // Check if username exists in users collection
    const usersRef = admin.firestore().collection('users');
    const querySnapshot = await usersRef.where('username', '==', username).get();
    
    // Check if username is reserved
    const usernameDoc = await admin.firestore().collection('usernames').doc(username).get();
    
    const isAvailable = querySnapshot.empty && !usernameDoc.exists;
    
    return {
      available: isAvailable,
      reason: isAvailable ? null : 'Username is already taken'
    };
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check username availability');
  }
});

// Reserve username when user claims it
export const reserveUsername = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { username } = data;
  const userId = context.auth.uid;
  
  if (!username) {
    throw new functions.https.HttpsError('invalid-argument', 'Username is required');
  }

  try {
    // Use a transaction to ensure atomicity
    return await admin.firestore().runTransaction(async (transaction) => {
      const usernameRef = admin.firestore().collection('usernames').doc(username);
      const usernameDoc = await transaction.get(usernameRef);
      
      if (usernameDoc.exists) {
        throw new functions.https.HttpsError('already-exists', 'Username is already taken');
      }
      
      // Reserve the username
      transaction.set(usernameRef, {
        userId,
        reservedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    });
  } catch (error) {
    console.error('Error reserving username:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to reserve username');
  }
});

// Generate HTML for profile pages
function generateProfileHTML(profile: any): string {
  const socialIcons: { [key: string]: string } = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    tiktok: '🎵',
    youtube: '📺',
    linkedin: '💼'
  };

  const socialLinksHtml = Object.entries(profile.socialLinks)
    .filter(([_, url]) => url)
    .map(([platform, url]) => `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="social-link">
        <span class="social-icon">${socialIcons[platform] || '🔗'}</span>
        <span class="social-name">${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
      </a>
    `).join('');

  const contactHtml = Object.entries(profile.contactInfo)
    .filter(([_, value]) => value)
    .map(([type, value]) => `
      <div class="contact-item">
        <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong>
        ${type === 'email' ? `<a href="mailto:${value}">${value}</a>` : 
          type === 'phone' ? `<a href="tel:${value}">${value}</a>` :
          type === 'website' ? `<a href="${value}" target="_blank">${value}</a>` : value}
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.displayName} - IrtzaLink</title>
    <meta name="description" content="${profile.bio || `${profile.displayName}'s profile on IrtzaLink`}">
    
    <!-- Open Graph meta tags -->
    <meta property="og:title" content="${profile.displayName} - IrtzaLink">
    <meta property="og:description" content="${profile.bio || `Connect with ${profile.displayName}`}">
    <meta property="og:image" content="${profile.photoURL || 'https://via.placeholder.com/400x400/000000/FFFFFF?text=' + encodeURIComponent(profile.displayName.charAt(0))}">
    <meta property="og:url" content="${profile.profileURL}">
    <meta property="og:type" content="profile">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: ${profile.theme === 'light' ? '#ffffff' : '#000000'};
            color: ${profile.theme === 'light' ? '#000000' : '#ffffff'};
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .profile-container {
            max-width: 400px;
            width: 100%;
            text-align: center;
            padding: 40px 20px;
        }
        
        .profile-image {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            object-fit: cover;
            border: 3px solid ${profile.theme === 'light' ? '#e0e0e0' : '#333333'};
        }
        
        .profile-name {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .profile-username {
            font-size: 16px;
            color: ${profile.theme === 'light' ? '#666666' : '#cccccc'};
            margin-bottom: 15px;
        }
        
        .profile-bio {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 30px;
            color: ${profile.theme === 'light' ? '#333333' : '#dddddd'};
        }
        
        .social-links {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .social-link {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 15px;
            background: ${profile.theme === 'light' ? '#f8f8f8' : '#1a1a1a'};
            border: 1px solid ${profile.theme === 'light' ? '#e0e0e0' : '#333333'};
            border-radius: 12px;
            text-decoration: none;
            color: inherit;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .social-link:hover {
            transform: translateY(-2px);
            background: ${profile.theme === 'light' ? '#f0f0f0' : '#2a2a2a'};
        }
        
        .social-icon {
            font-size: 20px;
        }
        
        .contact-info {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid ${profile.theme === 'light' ? '#e0e0e0' : '#333333'};
        }
        
        .contact-item {
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .contact-item a {
            color: ${profile.theme === 'light' ? '#007bff' : '#66b3ff'};
            text-decoration: none;
        }
        
        .contact-item a:hover {
            text-decoration: underline;
        }
        
        .powered-by {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid ${profile.theme === 'light' ? '#e0e0e0' : '#333333'};
            font-size: 12px;
            color: ${profile.theme === 'light' ? '#999999' : '#666666'};
        }
        
        .powered-by a {
            color: inherit;
            text-decoration: none;
        }
        
        @media (max-width: 480px) {
            .profile-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="profile-container">
        <img src="${profile.photoURL || 'https://via.placeholder.com/120x120/333333/ffffff?text=' + encodeURIComponent(profile.displayName.charAt(0))}" alt="${profile.displayName}" class="profile-image">
        
        <h1 className="profile-name">${profile.displayName}</h1>
        <p className="profile-username">
          @${profile.username}
          ${getVerifiedUsers().includes(profile.username.toLowerCase()) ? 
            '<svg class="verified-badge" width="16" height="16" fill="#3b82f6" viewBox="0 0 20 20" style="display: inline-block; margin-left: 4px; vertical-align: middle;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.73 10.1a.75.75 0 00-1.06 1.061l1.999 1.999a.75.75 0 001.137-.089l4-5.6z" clip-rule="evenodd" /></svg>' : 
            ''}
        </p>
        
        ${profile.bio ? `<p class="profile-bio">${profile.bio}</p>` : ''}
        
        <div class="social-links">
            ${socialLinksHtml}
        </div>
        
        ${contactHtml ? `
        <div class="contact-info">
            <h3>Contact</h3>
            ${contactHtml}
        </div>
        ` : ''}
        
        <div class="powered-by">
            <a href="https://irtzalink.com" target="_blank">Powered by IrtzaLink</a>
        </div>
    </div>
    
    <script>
        // Track QR scan if coming from QR code
        if (document.referrer === '' || navigator.userAgent.includes('QR')) {
            fetch('/trackQRScan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: '${profile.userId}',
                    userAgent: navigator.userAgent,
                    source: 'qr_code'
                })
            }).catch(() => {}); // Ignore errors
        }
    </script>
</body>
</html>
  `;
}

// Clean up expired temporary files (scheduled function)
export const cleanupTempFiles = functions.pubsub.schedule('every 24 hours').onRun(async () => {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ prefix: 'temp/' });
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const deletePromises = files
    .filter(file => {
      const [metadata] = file.metadata;
      return new Date(metadata.timeCreated) < yesterday;
    })
    .map(file => file.delete());
  
  await Promise.all(deletePromises);
  
  console.log(`Cleaned up ${deletePromises.length} temporary files`);
  return null;
});