// Server environment loader
require('dotenv').config({ path: '.env.server' });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');

const { verifyIdToken } = require('./firebaseAdmin');
const { supabase } = require('./supabaseClient');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB, memory buffer

const PORT = process.env.PORT || 4000;
const BUCKET = process.env.STORAGE_BUCKET || 'profiles';
const USE_SIGNED_URLS = (process.env.USE_SIGNED_URLS || 'false').toLowerCase() === 'true';
const SIGNED_URL_TTL = parseInt(process.env.SIGNED_URL_TTL || '86400', 10); // 24h by default

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'upload-api', bucket: BUCKET, signed: USE_SIGNED_URLS });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file is required' });

    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return res.status(415).json({ error: 'Unsupported file type' });
    }

    const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf' };
    const ext = extMap[file.mimetype] || 'bin';

    const name = crypto.randomUUID();
    const objectPath = `${uid}/${name}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    let publicUrl = '';
    if (USE_SIGNED_URLS) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(objectPath, SIGNED_URL_TTL);
      if (signErr) return res.status(500).json({ error: signErr.message });
      publicUrl = signed?.signedUrl || '';
    } else {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
      publicUrl = pub.publicUrl;
    }

    return res.json({ path: objectPath, url: publicUrl, contentType: file.mimetype, size: file.size });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Upload API listening on http://localhost:${PORT}`);
});
