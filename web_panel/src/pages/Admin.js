import React from 'react';
import AdminPanel from '../components/AdminPanel';

const Admin = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AdminPanel user={user} />
    </div>
  );
};

export default Admin;
