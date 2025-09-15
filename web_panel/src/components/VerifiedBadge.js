import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { isVerifiedUser } from '../config/verifiedAccounts';

const VerifiedBadge = ({ username, className = "" }) => {
  // Check if username is verified using config file
  const isVerified = isVerifiedUser(username);
  
  if (!isVerified) {
    return null;
  }
  
  return (
    <CheckBadgeIcon 
      className={`inline-block text-blue-500 ml-1 ${className}`} 
      title="Verified account"
    />
  );
};

export default VerifiedBadge;
