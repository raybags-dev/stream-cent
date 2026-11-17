import type { Plan, User } from '../../types';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code?: string; message?: string };
}

interface RawResponse<T> {
  ok: boolean;
  status: number;
  body: ApiEnvelope<T> | null;
}

function apiBase(): string {
  return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? '';
}

async function requestRaw<T>(path: string, options: RequestInit = {}): Promise<RawResponse<T>> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  return { ok: response.ok, status: response.status, body };
}

function errorMessage(response: RawResponse<unknown>, fallback: string): string {
  return response.body?.error?.message ?? fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await requestRaw<T>(path, options);
  if (!response.ok || !response.body?.success) {
    throw new Error(errorMessage(response, 'Request failed.'));
  }
  return response.body.data as T;
}

export interface AuthSession {
  user: User;
  accessExpiresIn: number;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    return request<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(
    email: string,
    password: string,
    planId: Plan['id'],
    profileName: string,
    avatarUrl: string,
  ): Promise<AuthSession> {
    return request<AuthSession>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, planId, profileName, avatarUrl }),
    });
  },

  async me(): Promise<User | null> {
    const first = await requestRaw<User>('/api/auth/me');
    if (first.ok && first.body?.success && first.body.data) return first.body.data;

    if (first.status === 401) {
      const refreshed = await requestRaw<AuthSession>('/api/auth/refresh', { method: 'POST' });
      if (refreshed.ok && refreshed.body?.success && refreshed.body.data?.user) {
        return refreshed.body.data.user;
      }
    }

    return null;
  },

  async refresh(): Promise<User | null> {
    const response = await requestRaw<AuthSession>('/api/auth/refresh', { method: 'POST' });
    if (response.ok && response.body?.success && response.body.data?.user) {
      return response.body.data.user;
    }
    return null;
  },

  async logout(): Promise<void> {
    await requestRaw('/api/auth/logout', { method: 'POST' });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await request<void>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async forgotPassword(email: string): Promise<string | undefined> {
    const data = await request<{ resetToken?: string } | undefined>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return data?.resetToken;
  },

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const data = await request<{ user: User }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
    return data.user;
  },
};
