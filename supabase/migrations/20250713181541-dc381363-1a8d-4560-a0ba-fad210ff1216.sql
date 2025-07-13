-- Security Fixes and Profile Management (Safe Version)

-- Step 1: Create profiles table with proper user management (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
          id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
          email text NOT NULL,
          full_name text,
          avatar_url text,
          user_role text DEFAULT 'user',
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        -- Enable RLS on profiles
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 2: Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger for new user registration (replace if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 6: Update RLS policies to be more secure for properties
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
CREATE POLICY "Authenticated users can view properties" ON public.properties
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 7: Update RLS policies for property images  
DROP POLICY IF EXISTS "Authenticated users can view property images" ON public.property_images;
CREATE POLICY "Authenticated users can view property images" ON public.property_images
  FOR SELECT USING (auth.role() = 'authenticated');