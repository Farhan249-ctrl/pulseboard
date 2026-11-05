const TOKEN_KEY = 'pulseboard_token';

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Pulse {
  id: string;
  day?: string;
  mood: number;
  note: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface TodayFeedResponse {
  pulses: Pulse[];
}

export interface MyHistoryResponse {
  pulses: Pulse[];
}

export interface AdminSummaryResponse {
  day: string;
  postsToday: number;
  averageMoodToday: number | null;
  totalUsers: number;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json();
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.token);
    return result;
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.token);
    return result;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async postPulse(data: {
    mood: number;
    note?: string;
  }): Promise<{ pulse: Pulse }> {
    return this.request<{ pulse: Pulse }>('/pulses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTodayFeed(): Promise<TodayFeedResponse> {
    return this.request<TodayFeedResponse>('/pulses/today');
  }

  async getMyHistory(limit?: number): Promise<MyHistoryResponse> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<MyHistoryResponse>(`/pulses/mine${query}`);
  }

  async getAdminSummary(): Promise<AdminSummaryResponse> {
    return this.request<AdminSummaryResponse>('/admin/summary');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const api = new ApiClient();
