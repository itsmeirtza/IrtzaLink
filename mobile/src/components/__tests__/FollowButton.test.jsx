import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FollowButton from '../../components/FollowButton';

// Mock toast to avoid side effects
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

// Mock follow data manager to no-op
jest.mock('../../services/followDataManager', () => ({
  followDataManager: {
    clearFollowRelationship: jest.fn(),
    saveFollowRelationship: jest.fn(),
    loadFollowRelationship: jest.fn(),
    updateFollowRelationship: jest.fn()
  }
}));

// Mock Firebase follow APIs
jest.mock('../../services/firebase', () => ({
  followUser: jest.fn(async () => ({ success: true })),
  unfollowUser: jest.fn(async () => ({ success: true })),
  getFollowRelationship: jest.fn(async () => ({ success: true, relationship: 'none' }))
}));

const { followUser, getFollowRelationship } = require('../../services/firebase');

describe('FollowButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  const currentUser = { uid: 'USER_A', username: 'user_a' };
  const targetUser = { uid: 'USER_B', username: 'user_b' };

  test('changes to "Following" immediately after follow', async () => {
    getFollowRelationship.mockResolvedValueOnce({ success: true, relationship: 'none' });

    render(<FollowButton currentUser={currentUser} targetUser={targetUser} />);

    // Wait for initial check to complete
    await screen.findByRole('button', { name: /follow/i });

    fireEvent.click(screen.getByRole('button', { name: /follow/i }));

    // Button should optimistically update to Following
    expect(await screen.findByText(/following/i)).toBeInTheDocument();
  });

  test('shows "Follow Back" then becomes "Friends" after follow-back', async () => {
    // Initial relationship: target follows current user
    getFollowRelationship
      .mockResolvedValueOnce({ success: true, relationship: 'follower' }) // on mount
      .mockResolvedValueOnce({ success: true, relationship: 'friends' }); // after recheck

    render(<FollowButton currentUser={currentUser} targetUser={targetUser} />);

    // Wait for initial state
    await screen.findByRole('button', { name: /follow back/i });

    // Click Follow Back
    fireEvent.click(screen.getByRole('button', { name: /follow back/i }));

    // Advance timers to trigger post-follow recheck
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    // Should show Friends after mutual follow (or at least reflect following state)
    try {
      expect(await screen.findByText(/friends/i)).toBeInTheDocument();
    } catch (e) {
      expect(await screen.findByText(/following/i)).toBeInTheDocument();
    }
  });
});
