export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  usage_types: string[];
  is_professional: boolean;
  onboarding_completed: boolean;
  created_at: string;
};

export type Motorcycle = {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number | null;
  plate: string | null;
  current_km: number;
  purchase_value: number | null;
  purchase_date: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Income = {
  id: string;
  user_id: string;
  motorcycle_id: string | null;
  work_session_id: string | null;
  category: string;
  amount: number;
  date: string;
  time: string | null;
  description: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  motorcycle_id: string | null;
  work_session_id: string | null;
  category: string;
  group_name: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
};

export type FuelRecord = {
  id: string;
  user_id: string;
  motorcycle_id: string | null;
  date: string;
  km: number;
  liters: number;
  price_per_liter: number;
  total: number;
  station: string | null;
  description: string | null;
  created_at: string;
};

export type MaintenanceRecord = {
  id: string;
  user_id: string;
  motorcycle_id: string | null;
  category: string;
  description: string | null;
  date: string;
  km: number | null;
  cost: number;
  next_km: number | null;
  next_date: string | null;
  workshop: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  type: string;
  name: string;
  target_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
};

export type WorkSession = {
  id: string;
  user_id: string;
  motorcycle_id: string | null;
  start_time: string;
  end_time: string | null;
  start_km: number | null;
  end_km: number | null;
  total_income: number;
  total_expense: number;
  net_profit: number;
  created_at: string;
};

export type AppDocument = {
  id: string;
  user_id: string;
  motorcycle_id: string | null;
  name: string;
  expiration_date: string | null;
  amount: number | null;
  description: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
};
