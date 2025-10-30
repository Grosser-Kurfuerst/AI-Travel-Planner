import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  preferences: {
    interests?: string[];
  } | null;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: 'planning' | 'ongoing' | 'completed';
  created_at: string;
}

export interface Activity {
  id: string;
  trip_id: string;
  day_number: number;
  start_time: string;
  type: 'attraction' | 'restaurant' | 'transport' | 'hotel' | 'other';
  name: string;
  description: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_cost: number | null;
}

export interface Expense {
  id: string;
  trip_id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
}

