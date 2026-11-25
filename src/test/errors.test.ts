import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { parseApiError } from '../utils/errors';

function axiosErrorWithResponse(status: number, data: unknown) {
  const response = { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

describe('parseApiError', () => {
  it('uses the API message and field errors from the response envelope', () => {
    const parsed = parseApiError(
      axiosErrorWithResponse(400, { success: false, message: 'Validation failed', errors: { phone: 'Please enter a valid phone number' } }),
    );
    expect(parsed.status).toBe(400);
    expect(parsed.message).toBe('Validation failed');
    expect(parsed.fieldErrors.phone).toBe('Please enter a valid phone number');
  });

  it('passes through slot conflict messages (409)', () => {
    const parsed = parseApiError(axiosErrorWithResponse(409, { success: false, message: 'This time slot has just been booked.' }));
    expect(parsed.status).toBe(409);
    expect(parsed.message).toMatch(/just been booked/);
  });

  it('falls back to a friendly message by status when the body has none', () => {
    expect(parseApiError(axiosErrorWithResponse(429, '')).message).toMatch(/too many/i);
    expect(parseApiError(axiosErrorWithResponse(500, null)).message).toMatch(/went wrong/i);
  });

  it('reports network failures without a response', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(parseApiError(err).message).toMatch(/unable to reach the server/i);
  });

  it('reports timeouts', () => {
    const err = new AxiosError('timeout', 'ECONNABORTED');
    expect(parseApiError(err).message).toMatch(/timed out/i);
  });

  it('handles non-axios errors', () => {
    expect(parseApiError(new Error('boom')).message).toBe('boom');
    expect(parseApiError('weird').message).toMatch(/went wrong/i);
  });
});
