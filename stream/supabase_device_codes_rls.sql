-- Run this in Supabase Dashboard > SQL Editor to allow authenticated users to manage their device sessions

-- 1. Ensure RLS is enabled on the device_codes table
ALTER TABLE public.device_codes ENABLE ROW LEVEL SECURITY;

-- 2. Create the policy for managing sessions (read, insert, update, delete)
DROP POLICY IF EXISTS "Users can manage their own device codes" ON public.device_codes;
CREATE POLICY "Users can manage their own device codes"
  ON public.device_codes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
