import React from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const Admin = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center py-16">
        <ShieldExclamationIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Access Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This section is only available to administrators.
        </p>
      </div>
    </div>
  );
};

export default Admin;