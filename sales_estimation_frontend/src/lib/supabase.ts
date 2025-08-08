import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltkgmmbapafctihusddh.supabase.co'
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface EstimationRequest {
  id?: number
  request_date: string | null
  desired_estimation_date: string | null
  project_name: string | null
  zac_project_number: string | null
  sales_person: string | null
  estimation_person: string | null
  status: string | null
  estimation: string | null
  completion_date: string | null
  remarks: string | null
  estimation_materials: string | null
  box_url: string | null
  others: string | null
  created_at?: string
  updated_at?: string
}

export interface User {
  id?: number
  username: string
  email: string
  created_at?: string
  updated_at?: string
}

export interface AppSetting {
  id?: number
  setting_key: string
  setting_value: string
  created_at?: string
  updated_at?: string
}

export const STATUS_OPTIONS = [
  "未着手",
  "資料待ち", 
  "着手中",
  "検討中",
  "見積もり待",
  "ZAC登録待",
  "完了",
  "中止"
]
