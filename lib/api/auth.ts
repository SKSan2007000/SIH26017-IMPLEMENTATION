import { http, getApiBaseUrl, isBackendConfigured } from './httpClient';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  designation?: string;
  department?: string;
  phone?: string;
  district?: string;
  zone?: string;
  address?: string;
  isActive: boolean;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  role: string;
  userId: string;
  email: string;
  fullName: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_projects: number;
  high_risk_projects: number;
  critical_parcels: number;
  pending_approvals: number;
  open_incidents: number;
  system_alerts: number;
}

export const DEMO_USERS: UserProfile[] = [
  { id: 'USR-ADMIN-00', email: 'admin@landguard.ai', fullName: 'LandGuard System Administrator', role: 'SUPER_ADMIN', designation: 'Super Administrator', department: 'Central Administration', district: 'Central', zone: 'HQ', isActive: true },
  { id: 'USR-HEAD-00', email: 'head@landguard.ai', fullName: 'Dr. A. Sundaram (DEMO)', role: 'PROJECT_HEAD', designation: 'Project Director — National Corridors', department: 'National Corridors Division', district: 'Statewide', zone: 'State Grid', isActive: true },
  { id: 'USR-DIST-00', email: 'district@landguard.ai', fullName: 'M. K. Revathi IAS (DEMO)', role: 'DISTRICT_OFFICER', designation: 'District Collector — Chennai', department: 'District Administration Chennai', district: 'Chennai', zone: 'Central Zone', isActive: true },
  { id: 'USR-LAO-00', email: 'lao@landguard.ai', fullName: 'K. Rajagopal (DEMO)', role: 'LAND_ACQUISITION_OFFICER', designation: 'Special LAO — Corridor Division', department: 'Land Acquisition Wing', district: 'Chennai', zone: 'South Zone', isActive: true },
  { id: 'USR-FIELD-00', email: 'field@landguard.ai', fullName: 'R. Vignesh (DEMO)', role: 'FIELD_OFFICER', designation: 'Senior Field Surveyor', department: 'Field Cadastral Survey Division', district: 'Chennai', zone: 'Zone A', isActive: true },
  { id: 'USR-SUP-00', email: 'supervisor@landguard.ai', fullName: 'P. Ananthi (DEMO)', role: 'SUPERVISOR', designation: 'Cadastral Verification Supervisor', department: 'Quality & Verification Wing', district: 'Chennai', zone: 'South Zone', isActive: true },
  { id: 'USR-CIT-00', email: 'citizen@landguard.ai', fullName: 'DEMO Citizen User', role: 'CITIZEN', designation: 'Land Owner Representative', department: 'Citizen Services', district: 'Chennai', zone: 'Zone A', isActive: true },
  { id: 'USR-CON-00', email: 'contractor@landguard.ai', fullName: 'DEMO Infra Consortium', role: 'CONTRACTOR', designation: 'EPC Highway Contractor', department: 'Contractor Infrastructure Operations', district: 'Chennai', zone: 'Corridor 1', isActive: true },
];

export async function checkBackendHealth(): Promise<{ isOnline: boolean; url: string; error?: string }> {
  try {
    const base = getApiBaseUrl().replace(/\/api(\/v1)?$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${base}/health`, { method: 'GET', signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    return { isOnline: res.ok, url: base };
  } catch (err: any) {
    return { isOnline: false, url: getApiBaseUrl(), error: err?.message };
  }
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthTokenResponse> => {
    try {
      const res = await http.post<any>('/api/v1/auth/login', { email, password });
      if (res?.access_token && typeof window !== 'undefined') {
        localStorage.setItem('landguard_token', res.access_token);
        localStorage.setItem('landguard_user', JSON.stringify({
          accessToken: res.access_token,
          tokenType: res.token_type,
          role: res.role,
          userId: res.user_id,
          email: res.email,
          fullName: res.full_name,
        }));
      }
      return {
        accessToken: res.access_token,
        tokenType: res.token_type,
        role: res.role,
        userId: res.user_id,
        email: res.email,
        fullName: res.full_name,
      };
    } catch (err) {
      throw err;
    }
  },

  loginDemo: (email: string, role?: string): AuthTokenResponse => {
    const cleanEmail = email.trim().toLowerCase();
    const matched = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail) || {
      id: `USR-DEMO-${Date.now().toString().slice(-4)}`,
      email: cleanEmail || 'admin@landguard.ai',
      fullName: 'Demo LandGuard User',
      role: role || 'SUPER_ADMIN',
      designation: 'Demonstration Account',
      department: 'LandGuard AI Prototype',
      isActive: true,
    };

    const token = `demo_jwt_token_${matched.role}_${Date.now()}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('landguard_token', token);
      localStorage.setItem('landguard_user', JSON.stringify({
        accessToken: token,
        tokenType: 'bearer',
        role: matched.role,
        userId: matched.id,
        email: matched.email,
        fullName: matched.fullName,
      }));
    }
    return {
      accessToken: token,
      tokenType: 'bearer',
      role: matched.role,
      userId: matched.id,
      email: matched.email,
      fullName: matched.fullName,
    };
  },

  register: async (data: {
    email: string;
    fullName: string;
    password: string;
    role?: string;
    phone?: string;
    district?: string;
    zone?: string;
    address?: string;
  }): Promise<UserProfile> => {
    const payload = {
      email: data.email,
      full_name: data.fullName,
      password: data.password,
      role: data.role || 'CITIZEN',
      phone: data.phone || '+91 90000-00000',
      district: data.district,
      zone: data.zone,
      address: data.address,
      is_active: true,
    };
    const res = await http.post<any>('/api/v1/auth/register', payload);
    return {
      id: res.id,
      email: res.email,
      fullName: res.full_name,
      role: res.role,
      designation: res.designation,
      department: res.department,
      phone: res.phone,
      district: res.district,
      zone: res.zone,
      address: res.address,
      isActive: res.is_active,
    };
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const res = await http.get<any>('/api/v1/auth/me');
      return {
        id: res.id,
        email: res.email,
        fullName: res.full_name,
        role: res.role,
        designation: res.designation,
        department: res.department,
        phone: res.phone,
        district: res.district,
        zone: res.zone,
        address: res.address,
        isActive: res.is_active,
      };
    } catch {
      // Clear invalid credentials if request fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('landguard_token');
        localStorage.removeItem('landguard_user');
      }
      return null;
    }
  },

  listUsers: async (params?: { search?: string; role?: string; status?: string }): Promise<UserProfile[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.role && params.role !== 'all') query.append('role', params.role);
      if (params?.status && params.status !== 'all') query.append('status', params.status);
      const url = `/api/v1/auth/users${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await http.get<any[]>(url);
      return res.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        designation: u.designation,
        department: u.department,
        phone: u.phone,
        district: u.district,
        zone: u.zone,
        address: u.address,
        isActive: u.is_active,
      }));
    } catch {
      // Fallback demo users list
      return [
        { id: 'USR-ADMIN-00', email: 'admin@landguard.ai', fullName: 'LandGuard System Administrator', role: 'SUPER_ADMIN', designation: 'Super Administrator', department: 'Central Administration', district: 'Central', zone: 'HQ', isActive: true },
        { id: 'USR-HEAD-00', email: 'head@landguard.ai', fullName: 'Dr. A. Sundaram (DEMO)', role: 'PROJECT_HEAD', designation: 'Project Director — National Corridors', department: 'National Corridors Division', district: 'Statewide', zone: 'State Grid', isActive: true },
        { id: 'USR-DIST-00', email: 'district@landguard.ai', fullName: 'M. K. Revathi IAS (DEMO)', role: 'DISTRICT_OFFICER', designation: 'District Collector — Chennai', department: 'District Administration Chennai', district: 'Chennai', zone: 'Central Zone', isActive: true },
        { id: 'USR-LAO-00', email: 'lao@landguard.ai', fullName: 'K. Rajagopal (DEMO)', role: 'LAND_ACQUISITION_OFFICER', designation: 'Special LAO — Corridor Division', department: 'Land Acquisition Wing', district: 'Chennai', zone: 'South Zone', isActive: true },
        { id: 'USR-FIELD-00', email: 'field@landguard.ai', fullName: 'R. Vignesh (DEMO)', role: 'FIELD_OFFICER', designation: 'Senior Field Surveyor', department: 'Field Cadastral Survey Division', district: 'Chennai', zone: 'Zone A', isActive: true },
        { id: 'USR-SUP-00', email: 'supervisor@landguard.ai', fullName: 'P. Ananthi (DEMO)', role: 'SUPERVISOR', designation: 'Cadastral Verification Supervisor', department: 'Quality & Verification Wing', district: 'Chennai', zone: 'South Zone', isActive: true },
        { id: 'USR-CIT-00', email: 'citizen@landguard.ai', fullName: 'DEMO Citizen User', role: 'CITIZEN', designation: 'Land Owner Representative', department: 'Citizen Services', district: 'Chennai', zone: 'Zone A', isActive: true },
        { id: 'USR-CON-00', email: 'contractor@landguard.ai', fullName: 'DEMO Infra Consortium', role: 'CONTRACTOR', designation: 'EPC Highway Contractor', department: 'Contractor Infrastructure Operations', district: 'Chennai', zone: 'Corridor 1', isActive: true },
      ];
    }
  },

  createUser: async (data: {
    email: string;
    fullName: string;
    password: string;
    role: string;
    designation?: string;
    department?: string;
    phone?: string;
    district?: string;
    zone?: string;
    address?: string;
    isActive?: boolean;
  }): Promise<UserProfile> => {
    const payload = {
      email: data.email,
      full_name: data.fullName,
      password: data.password,
      role: data.role,
      designation: data.designation,
      department: data.department,
      phone: data.phone,
      district: data.district,
      zone: data.zone,
      address: data.address,
      is_active: data.isActive ?? true,
    };
    const res = await http.post<any>('/api/v1/auth/users', payload);
    return {
      id: res.id,
      email: res.email,
      fullName: res.full_name,
      role: res.role,
      designation: res.designation,
      department: res.department,
      phone: res.phone,
      district: res.district,
      zone: res.zone,
      address: res.address,
      isActive: res.is_active,
    };
  },

  updateUser: async (
    userId: string,
    data: {
      fullName?: string;
      designation?: string;
      department?: string;
      phone?: string;
      district?: string;
      zone?: string;
      address?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    }
  ): Promise<UserProfile> => {
    const payload: any = {};
    if (data.fullName !== undefined) payload.full_name = data.fullName;
    if (data.designation !== undefined) payload.designation = data.designation;
    if (data.department !== undefined) payload.department = data.department;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.district !== undefined) payload.district = data.district;
    if (data.zone !== undefined) payload.zone = data.zone;
    if (data.address !== undefined) payload.address = data.address;
    if (data.role !== undefined) payload.role = data.role;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    if (data.password) payload.password = data.password;

    const res = await http.patch<any>(`/api/v1/auth/users/${userId}`, payload);
    return {
      id: res.id,
      email: res.email,
      fullName: res.full_name,
      role: res.role,
      designation: res.designation,
      department: res.department,
      phone: res.phone,
      district: res.district,
      zone: res.zone,
      address: res.address,
      isActive: res.is_active,
    };
  },

  resetPassword: async (userId: string, newPassword: string): Promise<{ status: string; message: string }> => {
    return http.post<{ status: string; message: string }>(`/api/v1/auth/users/${userId}/reset-password`, { new_password: newPassword });
  },

  deleteUser: async (userId: string): Promise<{ status: string; message: string }> => {
    return http.delete<{ status: string; message: string }>(`/api/v1/auth/users/${userId}`);
  },

  getAdminStats: async (): Promise<AdminStats> => {
    try {
      return await http.get<AdminStats>('/api/v1/auth/admin-stats');
    } catch {
      return {
        total_users: 8,
        active_users: 8,
        total_projects: 10,
        high_risk_projects: 3,
        critical_parcels: 18,
        pending_approvals: 12,
        open_incidents: 6,
        system_alerts: 5,
      };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('landguard_token');
      localStorage.removeItem('landguard_user');
    }
  },
};

