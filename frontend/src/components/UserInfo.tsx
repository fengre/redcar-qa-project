import React from 'react';
import { useAuth } from '../auth/AuthContext';

export const UserInfo: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.username}</h3>
            <p className="text-sm text-gray-500">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}; 