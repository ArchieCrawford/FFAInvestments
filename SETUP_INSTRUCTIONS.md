# 🚀 FFA Investments Supabase Quick Setup

Based on your debug logs, here's what needs to be done to get authentication working:

## 📋 Issues Found:
1. ❌ Database tables don't exist (connection query failed)
2. ❌ Admin users haven't been created yet
3. ❌ Email validation is strict

## ✅ Step-by-Step Fix:

### **Step 1: Set Up Database Schema**
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `wynbgrgmrygkodcdumii`
3. Go to **SQL Editor** (in the left sidebar)
4. Copy and paste the entire contents of `supabase-schema.sql` 
5. Click **RUN** to execute the SQL

This will create:
- `profiles` table for user data
- `ffa_timeline` table for your CSV data
- All necessary Row Level Security policies
- Triggers for automatic profile creation

### **Step 2: Create Admin Users**
Run this command in your project directory:
```bash
node create-admin-users.js
```

This will create:
- admin@ffa.com (password: admin123)
- archie.crawford1@gmail.com (password: archie123)

### **Step 3: Test Authentication**
1. Refresh your browser at `http://localhost:3001`
2. Click "Test Connection" - should now work
3. Try signing in with `admin@ffa.com` / `admin123`

## 🔧 Alternative: Manual Database Setup

If the automated script doesn't work, you can manually create the tables:

### **Basic Tables SQL:**
```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email IN ('admin@ffa.com', 'archie.crawford1@gmail.com') THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN new;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🎯 Expected Results:

After completing these steps:
- ✅ Connection test should pass
- ✅ Admin login should work
- ✅ You'll see "Profile found" messages in logs
- ✅ App will redirect to dashboard after login

## 🆘 If Still Having Issues:

1. **Check Supabase Project Status**: Ensure your project is active
2. **Verify API Keys**: Make sure they match your project
3. **Check Network**: Try from different network if blocked
4. **Enable Auth**: Verify email authentication is enabled in Supabase settings

## 📞 Next Steps:
1. Run the SQL schema in Supabase dashboard
2. Create admin users with the script
3. Test again with the debug tool
4. Share results if still having issues

The main issue is that your database tables don't exist yet, which is why the connection test fails and users can't be authenticated!