const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setTokens(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return null;
      }

      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async request<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    const token = this.getToken();

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Token expired — try refresh
    if (res.status === 401 && token) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        reqHeaders['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API_BASE}${path}`, {
          method,
          headers: reqHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new ApiError(res.status, error.error?.message || 'Request failed', error.error?.code);
    }

    return res.json();
  }

  get<T = unknown>(path: string) {
    return this.request<T>(path);
  }

  post<T = unknown>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body });
  }

  put<T = unknown>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body });
  }

  patch<T = unknown>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  delete<T = unknown>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Auth helpers
  async signup(data: {
    phone: string;
    email?: string;
    name: string;
    password: string;
    role: 'caregiver' | 'careseeker';
    language?: string;
  }) {
    const result = await this.post<{
      user: UserResponse;
      accessToken: string;
      refreshToken: string;
    }>('/auth/signup', data);

    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  async login(phone: string, password: string) {
    const result = await this.post<{
      user: UserResponse;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { phone, password });

    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await this.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    this.clearTokens();
  }

  async getMe(): Promise<UserResponse | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      return await this.get<UserResponse>('/auth/me');
    } catch {
      return null;
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface UserResponse {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: 'caregiver' | 'careseeker' | 'admin';
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const api = new ApiClient();
