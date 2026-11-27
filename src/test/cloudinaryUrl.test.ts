import { describe, expect, it } from 'vitest';
import { parseCloudinaryUrl } from '../utils/cloudinaryUrl';

describe('parseCloudinaryUrl', () => {
  it('reads key, secret and cloud name, with or without the CLOUDINARY_URL= prefix', () => {
    const expected = { apiKey: '123456789012345', apiSecret: 'aBc-DeF_123', cloudName: 'my-cloud' };
    expect(parseCloudinaryUrl('cloudinary://123456789012345:aBc-DeF_123@my-cloud')).toEqual(expected);
    expect(parseCloudinaryUrl(' CLOUDINARY_URL=cloudinary://123456789012345:aBc-DeF_123@my-cloud ')).toEqual(expected);
  });

  it('leaves placeholder secrets empty', () => {
    expect(parseCloudinaryUrl('cloudinary://123:<your_api_secret>@demo')).toEqual({ apiKey: '123', cloudName: 'demo' });
    expect(parseCloudinaryUrl('cloudinary://123:**********@demo')).toEqual({ apiKey: '123', cloudName: 'demo' });
  });

  it('rejects other text', () => {
    expect(parseCloudinaryUrl('https://res.cloudinary.com/demo')).toBeNull();
    expect(parseCloudinaryUrl('cloudinary://onlykey@demo')).toBeNull();
  });
});
