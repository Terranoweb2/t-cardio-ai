// Configuration de l'URL de l'API
const API_URL = 'http://localhost:5000/api';

// Types
export interface ApiResponse<T> {
  status: number;
  data: T;
  error?: string;
}

// Fonction générique pour les appels API
async function apiCall<T>(
  endpoint: string, 
  method: string = 'GET', 
  data: any = null, 
  token: string | null = null
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
      error: !response.ok ? responseData.message : undefined
    };
  } catch (error: any) {
    return {
      status: 500,
      data: {} as T,
      error: error.message || 'Une erreur est survenue lors de la communication avec le serveur'
    };
  }
}

// Types pour l'authentification
export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  message: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  medications?: string[];
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Types pour les mesures
export interface Measurement {
  id: string;
  userId: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  date: string;
  notes?: string;
  classification: string;
  createdAt: string;
}

export interface MeasurementsResponse {
  count: number;
  measurements: Measurement[];
}

export interface StatisticsResponse {
  averages: {
    systolic: number;
    diastolic: number;
    pulse: number;
  };
  trends: {
    systolic: string;
    diastolic: string;
    pulse: string;
  };
  classifications: Record<string, number>;
  latestMeasurements: Measurement[];
}

// Types pour le partage
export interface ShareToken {
  id: string;
  userId: string;
  token: string;
  name: string;
  recipientEmail?: string;
  notes?: string;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

export interface ShareTokensResponse {
  count: number;
  shareTokens: ShareToken[];
}

export interface AcceptedShare {
  id: string;
  tokenId: string;
  sharerId: string;
  sharerName: string;
  sharerEmail: string;
  name: string;
  expiresAt: string;
  acceptedAt: string;
}

export interface AcceptedSharesResponse {
  count: number;
  acceptedShares: AcceptedShare[];
}

// Types pour les rapports
export interface Report {
  id: string;
  userId: string;
  title: string;
  content: string;
  reportType: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ReportsResponse {
  count: number;
  reports: Report[];
}

// Services d'authentification
export const authService = {
  register: (userData: RegisterData) => 
    apiCall<AuthResponse>('/auth/register', 'POST', userData),
    
  login: (credentials: LoginData) => 
    apiCall<AuthResponse>('/auth/login', 'POST', credentials),
    
  getCurrentUser: (token: string) => 
    apiCall<UserProfile>('/auth/me', 'GET', null, token),
};

// Services de gestion des utilisateurs
export const userService = {
  getUserProfile: (userId: string, token: string) => 
    apiCall<UserProfile>(`/users/${userId}`, 'GET', null, token),
    
  updateUserProfile: (userId: string, userData: Partial<UserProfile>, token: string) => 
    apiCall<UserProfile>(`/users/${userId}`, 'PUT', userData, token),
    
  deleteUser: (userId: string, token: string) => 
    apiCall<{ message: string }>(`/users/${userId}`, 'DELETE', null, token),
};

// Services de mesures
export const measurementService = {
  getUserMeasurements: (userId: string, token: string, params?: { limit?: number, offset?: number, startDate?: string, endDate?: string }) => {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      queryString = `?${searchParams.toString()}`;
    }
    return apiCall<MeasurementsResponse>(`/measurements/user/${userId}${queryString}`, 'GET', null, token);
  },
  
  addMeasurement: (measurementData: Omit<Measurement, 'id' | 'createdAt'>, token: string) => 
    apiCall<Measurement>('/measurements', 'POST', measurementData, token),
    
  deleteMeasurement: (measurementId: string, token: string) => 
    apiCall<{ message: string }>(`/measurements/${measurementId}`, 'DELETE', null, token),
    
  getUserStatistics: (userId: string, token: string) => 
    apiCall<StatisticsResponse>(`/measurements/user/${userId}/statistics`, 'GET', null, token),
};

// Services de partage
export const shareService = {
  createShareToken: (shareData: { userId: string, name: string, recipientEmail?: string, expiresInDays?: number, notes?: string }, token: string) => 
    apiCall<{ message: string, shareToken: ShareToken }>('/shares', 'POST', shareData, token),
    
  getUserShareTokens: (userId: string, token: string) => 
    apiCall<ShareTokensResponse>(`/shares/user/${userId}`, 'GET', null, token),
    
  deactivateShareToken: (tokenId: string, token: string) => 
    apiCall<{ message: string }>(`/shares/${tokenId}/deactivate`, 'PUT', null, token),
    
  getShareTokenInfo: (shareToken: string, token: string) => 
    apiCall<{ shareToken: Partial<ShareToken> }>(`/shares/token/${shareToken}`, 'GET', null, token),
    
  acceptShareToken: (shareToken: string, recipientId: string, token: string) => 
    apiCall<{ message: string, acceptance: any }>(`/shares/token/${shareToken}/accept`, 'POST', { recipientId }, token),
    
  getAcceptedShares: (userId: string, token: string) => 
    apiCall<AcceptedSharesResponse>(`/shares/accepted/user/${userId}`, 'GET', null, token),
};

// Services de rapports
export const reportService = {
  createReport: (reportData: { userId: string, title: string, content: string, reportType: string, startDate?: string, endDate?: string }, token: string) => 
    apiCall<{ message: string, report: Report }>('/reports', 'POST', reportData, token),
    
  getUserReports: (userId: string, token: string, params?: { limit?: number, offset?: number, type?: string }) => {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.type) searchParams.append('type', params.type);
      queryString = `?${searchParams.toString()}`;
    }
    return apiCall<ReportsResponse>(`/reports/user/${userId}${queryString}`, 'GET', null, token);
  },
    
  getReport: (reportId: string, token: string) => 
    apiCall<{ report: Report }>(`/reports/${reportId}`, 'GET', null, token),
    
  deleteReport: (reportId: string, token: string) => 
    apiCall<{ message: string }>(`/reports/${reportId}`, 'DELETE', null, token),
    
  generateAnalysisReport: (reportData: { userId: string, title?: string, startDate?: string, endDate?: string, notes?: string }, token: string) => 
    apiCall<{ message: string, report: Report }>('/reports/analysis', 'POST', reportData, token),
};

// Service d'authentification local
export const authLocalStorageService = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },
  
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },
  
  setUser: (user: UserProfile) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
  
  getUser: (): UserProfile | null => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};
