export type Role = 'admin' | 'employee'
export type Language = 'de' | 'en' | 'vi'
export type PaymentMethod = 'cash' | 'twint' | 'credit_card'

export interface Profile {
  id: string
  full_name: string
  role: Role
  language: Language
  is_active: boolean
  created_at: string
}

export interface ServiceCategory {
  id: number
  name: string
}

export interface Service {
  id: number
  category_id: number
  name: string
  default_price: number | null
  price_label: string | null
  is_active: boolean
}

export interface Entry {
  id: string
  employee_id: string
  service_id: number
  entry_date: string
  time_from: string
  time_to: string
  amount: number
  payment_method: PaymentMethod
  notes: string | null
  created_at: string
  updated_at: string
  services?: {
    name: string
    service_categories?: {
      id: number
      name: string
    }
  }
}

export interface AdminEntry extends Entry {
  profiles?: {
    full_name: string
  }
}

export interface EmployeeWithEmail {
  id: string
  full_name: string
  role: Role
  language: Language
  is_active: boolean
  email: string
}

export type PeriodType = 'week' | 'month' | 'year' | 'custom'

export interface Filters {
  employee_id: string
  period: PeriodType
  date_from: string
  date_to: string
  payment_method: string
  category_id: string
  service_id: string
}
