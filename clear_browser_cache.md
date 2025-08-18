# Complete Cache Clearing Steps

## 1. Run the SQL Script
Execute `complete_user_reset.sql` in Supabase SQL Editor

## 2. Clear Browser Cache (Important!)
- **Chrome/Edge**: F12 → Application tab → Clear Storage → Clear site data
- **Firefox**: F12 → Storage tab → Clear All
- **Safari**: Develop menu → Empty Caches

## 3. Clear Browser Local Storage
In browser console (F12), run:
```javascript
// Clear all local storage
localStorage.clear();
sessionStorage.clear();

// Clear specific Supabase keys
localStorage.removeItem('sb-foljvthncelmqiiigztu-auth-token');
sessionStorage.removeItem('sb-foljvthncelmqiiigztu-auth-token');

// Clear any other auth-related storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth')) {
    localStorage.removeItem(key);
  }
});
```

## 4. Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

## 5. Use Incognito/Private Window
Test user registration in a fresh incognito window to avoid any remaining cache

## 6. Alternative: Clear Specific User Only
If you want to keep other users but just remove girish.sh@gmail.com:

```sql
-- Find the user ID first
SELECT id, email FROM auth.users WHERE email = 'girish.sh@gmail.com';

-- Delete specific user data (replace USER_ID with actual ID)
DELETE FROM listings WHERE user_id = 'USER_ID';
DELETE FROM identity_verifications WHERE user_id = 'USER_ID';
DELETE FROM user_profiles WHERE id = 'USER_ID';
DELETE FROM profiles WHERE id = 'USER_ID';

-- Delete the auth user
DELETE FROM auth.users WHERE email = 'girish.sh@gmail.com';
```