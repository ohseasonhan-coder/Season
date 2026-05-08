ALTER TABLE public.asset_app_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own profile" ON public.asset_app_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.asset_app_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.asset_app_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.asset_app_profiles
  FOR DELETE USING (auth.uid() = user_id);
