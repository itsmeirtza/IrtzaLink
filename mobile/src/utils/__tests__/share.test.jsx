import { getProfileUrl } from '../../utils/share';

describe('getProfileUrl', () => {
  test('builds .site URL with username when available', () => {
    expect(getProfileUrl({ userId: 'USER123', username: 'ali' })).toBe('https://irtzalink.site/ali');
  });
  test('falls back to .site /user/{id} when username missing', () => {
    expect(getProfileUrl({ userId: 'USER123', username: '' })).toBe('https://irtzalink.site/user/USER123');
  });
});
