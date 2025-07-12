-- Implement secure RLS policies for the StudentHome platform

-- 1. Drop overly permissive public policies
DROP POLICY IF EXISTS "properties_public_read" ON properties;
DROP POLICY IF EXISTS "property_images_public_read" ON property_images;
DROP POLICY IF EXISTS "scraped_data_public_read" ON scraped_data;
DROP POLICY IF EXISTS "locations_public_read" ON locations;
DROP POLICY IF EXISTS "universities_public_read" ON universities;

-- 2. Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  user_role text DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'moderator')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create user-specific policies for properties
CREATE POLICY "Authenticated users can view properties" 
ON properties FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only admins can insert properties" 
ON properties FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role = 'admin'
  )
);

CREATE POLICY "Only admins can update properties" 
ON properties FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- 4. Create policies for property images
CREATE POLICY "Authenticated users can view property images" 
ON property_images FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only admins can manage property images" 
ON property_images FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- 5. Restrict scraped data to admin only
CREATE POLICY "Only admins can access scraped data" 
ON scraped_data FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- 6. Allow public read access to universities and locations (these are reference data)
CREATE POLICY "Public can view universities" 
ON universities FOR SELECT 
USING (true);

CREATE POLICY "Public can view locations" 
ON locations FOR SELECT 
USING (true);

-- 7. Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- 8. Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();