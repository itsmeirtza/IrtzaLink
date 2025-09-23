import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GetVerified from '../../pages/GetVerified';

// Mock App AuthContext to avoid importing full App (which imports Firebase)
jest.mock('../../App', () => {
  const React = require('react');
  return { AuthContext: React.createContext(null) };
});

// Avoid importing Firebase in GetVerified dependency tree
jest.mock('../../services/firebase', () => ({ trackProfileVisit: jest.fn() }));

// Minimal user prop to avoid verified branch
const user = { userData: { username: 'someone' } };

describe('GetVerified contact links', () => {
  beforeEach(() => {
    window.open = jest.fn();
  });

  test('WhatsApp button opens correct link', async () => {
    render(<GetVerified user={user} />);
    const whatsapp = await screen.findByRole('button', { name: /whatsapp/i });
    fireEvent.click(whatsapp);
    expect(window.open).toHaveBeenCalledWith('https://wa.me/923706107055?text=Hello%20IrtzaLink', '_blank');
  });

  test('Instagram button opens correct link', async () => {
    render(<GetVerified user={user} />);
    const insta = await screen.findByRole('button', { name: /instagram @irtzalink/i });
    fireEvent.click(insta);
    expect(window.open).toHaveBeenCalledWith('https://instagram.com/irtzalink', '_blank');
  });
});
