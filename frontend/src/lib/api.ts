/**
 * API utility with automatic token refresh
 * Automatically refreshes access token when it expires (401 errors)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh token is invalid, clear everything and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.accessToken;

      // Update the access token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', newAccessToken);
        // Optionally update user data if provided
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }

      return newAccessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch wrapper with automatic token refresh on 401 errors
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Set up headers with authorization
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  // Only set Content-Type for JSON requests (not FormData)
  // FormData will set Content-Type automatically with boundary
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Make the initial request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get a 401, try to refresh the token and retry
  if (response.status === 401 && accessToken) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      // Retry the original request with the new token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(url, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed, return the original 401 response
      // (user will be redirected to login by refreshAccessToken)
      return response;
    }
  }

  return response;
}

/**
 * Get the API base URL
 */
export function getApiBase(): string {
  return API_BASE;
}

