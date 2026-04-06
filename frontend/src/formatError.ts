import { AxiosError } from 'axios';

export function formatNetworkError(error: unknown, defaultMsg = 'Something went wrong — please try again'): string {
  if (!error || typeof error !== 'object') return defaultMsg;

  const axiosError = error as AxiosError<{ detail?: string }>;

  // Network-level errors
  if (axiosError.message === 'Network Error') {
    return 'Network error — check your connection and try again';
  }
  if (axiosError.code === 'ECONNABORTED') {
    return 'Request timed out — please try again';
  }

  // HTTP errors with response
  if (axiosError.response) {
    const { status, data } = axiosError.response;
    if (status === 401) return 'Session expired — please sign in again';
    if (typeof data?.detail === 'string' && data.detail) return data.detail;
    if (status >= 500) return 'Server error — please try again later';
    if (status >= 400) return defaultMsg;
  }

  return defaultMsg;
}
