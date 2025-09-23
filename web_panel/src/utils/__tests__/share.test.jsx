import { getProfileUrl } from '../../utils/share';

describe('getProfileUrl', () => {
  test('builds vercel URL with user ID', () => {
    expect(getProfileUrl('USER123')).toBe('https://irtzalink.vercel.app/user/USER123');
  });
});
