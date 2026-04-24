import { getTokenFromLocalStorage } from './Auth';
import toast from 'react-hot-toast';

export interface ApiOptions extends RequestInit {
  includeAuth?: boolean;
  showErrorToast?: boolean; // Option to disable error toast for specific calls
}

/**
 * Utility function for making authenticated API calls
 * Automatically includes credentials for cookie-based auth and Authorization header from localStorage
 * Shows error toast notifications for failed requests
 */
export const apiCall = async (url: string, options: ApiOptions = {}) => {
  const { includeAuth = true, showErrorToast = true, ...restOptions } = options;
  const headers = new Headers(restOptions.headers);

  // Don't set Content-Type for FormData, let browser set it
  if (!(restOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (includeAuth) {
    const token = getTokenFromLocalStorage();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers,
    ...restOptions,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Show error toast if response is not ok and showErrorToast is true
    if (!response.ok && showErrorToast) {
      // Try to get error message from response body
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Ett fel uppstod';

      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.clone().json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use default message
        }
      }

      // Show toast with appropriate styling based on status code
      if (response.status === 401) {
        // toast.error('Du är inte inloggad. Vänligen logga in igen.');
      } else if (response.status === 403) {
        toast.error(errorMessage || 'Du har inte behörighet att utföra denna åtgärd.');
      } else if (response.status === 404) {
        toast.error(errorMessage || 'Resursen kunde inte hittas.');
      } else if (response.status >= 400 && response.status < 500) {
        toast.error(errorMessage);
      } else if (response.status >= 500) {
        toast.error('Ett serverfel uppstod. Försök igen senare.');
      }
    }

    return response;
  } catch (error) {
    // Network error or other fetch failure
    if (showErrorToast) {
      toast.error('Nätverksfel. Kontrollera din internetanslutning.');
    }
    throw error;
  }
};

/**
 * Helper for GET requests
 */
export const apiGet = (url: string, options: ApiOptions = {}) =>
  apiCall(url, { ...options, method: 'GET' });

/**
 * Helper for POST requests
 */
export const apiPost = (url: string, data?: any, options: ApiOptions = {}) =>
  apiCall(url, {
    ...options,
    method: 'POST',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
  });

/**
 * Helper for PUT requests
 */
export const apiPut = (url: string, data?: any, options: ApiOptions = {}) =>
  apiCall(url, {
    ...options,
    method: 'PUT',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
  });

/**
* Helper for PUT requests
*/
export const apiPatch = (url: string, data?: any, options: ApiOptions = {}) =>
  apiCall(url, {
    ...options,
    method: 'PATCH',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
  });


/**
 * Helper for DELETE requests
 */
export const apiDelete = (url: string, options: ApiOptions = {}) =>
  apiCall(url, { ...options, method: 'DELETE' });

/**
 * Export toast for manual usage in components
 * Usage:
 * import { toast } from '@/utils/api';
 * toast.success('Operation successful!');
 * toast.error('Something went wrong!');
 * toast.loading('Loading...');
 */
export { toast };