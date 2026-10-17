export interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  role: 'super_admin' | 'admin' | 'staff';
  avatar_url?: string | null;
  is_active: number | boolean;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminSession {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AdminSession;
}
