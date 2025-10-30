-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 trips 表
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget NUMERIC,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'ongoing', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 activities 表
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  start_time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attraction', 'restaurant', 'transport', 'hotel', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  estimated_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 expenses 表
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  expense_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON public.activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Profiles RLS 策略
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trips RLS 策略
CREATE POLICY "Users can view their own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- Activities RLS 策略
CREATE POLICY "Users can view activities of their trips"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities for their trips"
  ON public.activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities of their trips"
  ON public.activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities of their trips"
  ON public.activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Expenses RLS 策略
CREATE POLICY "Users can view expenses of their trips"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- 创建触发器：当用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧的触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表创建 updated_at 触发器
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 为 trips 表创建 updated_at 触发器
DROP TRIGGER IF EXISTS set_updated_at_trips ON public.trips;
CREATE TRIGGER set_updated_at_trips
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

