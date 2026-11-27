import type { CloudinaryPayload } from '../types';

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Reads a CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@<cloud_name>, as shown in the Cloudinary console under
 * API Keys) into form fields. Also accepts the "CLOUDINARY_URL=" prefix the console copies. A placeholder secret such
 * as <your_api_secret> or ********** is left empty. Returns null when the text is not a Cloudinary URL.
 */
export function parseCloudinaryUrl(raw: string): Partial<CloudinaryPayload> | null {
  const text = raw.trim().replace(/^CLOUDINARY_URL\s*=\s*/i, '').replace(/^["']|["']$/g, '');
  const match = /^cloudinary:\/\/([^:@/]+):([^@/]*)@([^/?#]+)\/?$/i.exec(text);
  if (!match) return null;
  const [, apiKey, apiSecret, cloudName] = match;
  const result: Partial<CloudinaryPayload> = { apiKey: decode(apiKey), cloudName: decode(cloudName) };
  if (apiSecret && !/^<.*>$|^\*+$/.test(apiSecret)) result.apiSecret = decode(apiSecret);
  return result;
}
