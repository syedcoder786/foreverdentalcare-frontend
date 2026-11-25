import { isAxiosError } from 'axios';
import type { ApiResponse } from '../types';

export interface ParsedApiError {
  status?: number;
  message: string;
  fieldErrors: Record<string, string>;
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to do that.',
  404: 'The requested item could not be found.',
  409: 'This conflicts with existing data. Please refresh and try again.',
  429: 'Too many attempts. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again later.',
};

/** Converts any thrown value (usually an AxiosError) into a user-friendly message plus field errors. */
export function parseApiError(error: unknown): ParsedApiError {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    if (!error.response) {
      return {
        message:
          error.code === 'ECONNABORTED'
            ? 'The request timed out. Please check your connection and try again.'
            : 'Unable to reach the server. Please check your internet connection and try again.',
        fieldErrors: {},
      };
    }
    const { status, data } = error.response;
    const apiMessage = data && typeof data === 'object' ? data.message : undefined;
    return {
      status,
      message: apiMessage || STATUS_MESSAGES[status] || 'Something went wrong. Please try again.',
      fieldErrors: (data && typeof data === 'object' && data.errors) || {},
    };
  }
  if (error instanceof Error) {
    return { message: error.message, fieldErrors: {} };
  }
  return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
}

export function getErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}
