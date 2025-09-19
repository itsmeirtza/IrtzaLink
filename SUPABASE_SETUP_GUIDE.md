# 🔧 Supabase Setup Guide - Data Persistence Fix

## ❌ Current Problem:
- Firebase Auth: ✅ Working (username persists)  
- Supabase Data: ❌ Not configured (profile data doesn't save)

## ✅ Solution:

### Step 1: Create FREE Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub/Google (FREE - no credit card needed)

### Step 2: Create New Project  
1. Click "New Project"
2. Choose any organization
3. Project name: `IrtzaLink`
4. Database password: Choose a strong password
5. Region: Choose closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### Step 3: Get API Keys
1. Go to Settings ⚙️ > API
2. Copy these two values:
   - **Project URL**: `https://xxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...` (long key)

### Step 4: Update Environment File
Replace lines 16-17 in `web_panel/.env`:

```env
# Replace these with your actual values:
REACT_APP_SUPABASE_URL=https://your-actual-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Step 5: Create Users Table
In Supabase dashboard:
1. Go to Table Editor
2. Click "Create a new table"
3. Table name: `users`
4. Add these columns:

| Column Name | Type | Settings |
|-------------|------|----------|
| user_id | text | Primary Key |
| display_name | text | - |
| username | text | Unique |
| bio | text | - |
| photo_url | text | - |
| social_links | jsonb | Default: {} |
| contact_info | jsonb | Default: {} |
| theme | text | Default: 'dark' |
| profile_url | text | - |
| is_active | boolean | Default: true |
| created_at | timestamptz | Default: now() |
| updated_at | timestamptz | Default: now() |

### Step 6: Enable Row Level Security (RLS)
1. Go to Authentication > Policies
2. Enable RLS on users table
3. Create these policies:

**Select Policy:**
- Name: `Users can view all profiles`
- Allow operation: SELECT
- Target roles: `public`
- Using expression: `true`

**Insert/Update Policy:**
- Name: `Users can manage own data`
- Allow operation: INSERT, UPDATE
- Target roles: `authenticated`
- Using expression: `true`

## 🎯 After Setup:
- ✅ Data will persist after signout
- ✅ Profile, bio, social links will save
- ✅ Dashboard will show all data
- ✅ 100% FREE (up to 50,000 requests/month)

## 🔄 Testing:
After setup, restart the development server:
```bash
cd web_panel
npm start
```

The app will show all data everywhere and nothing will clear on signout!