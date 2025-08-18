'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  identity_verified: boolean;
  verification_level: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    identity_verified: false,
    verification_level: 'none'
  });

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  const checkAdminAccess = async () => {
    // Simple admin check - in production you'd want proper role-based access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      identity_verified: user.identity_verified,
      verification_level: user.verification_level
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUser.id,
          updateData: editForm
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update local state
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...editForm, updated_at: new Date().toISOString() }
            : user
        ));
        setEditingUser(null);
        alert('User updated successfully!');
      } else {
        alert('Error updating user: ' + data.error);
      }
    } catch (err) {
      alert('Network error updating user');
      console.error('Error updating user:', err);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully!');
      } else {
        alert('Error deleting user: ' + data.error);
      }
    } catch (err) {
      alert('Network error deleting user');
      console.error('Error deleting user:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{
              borderWidth: '2px',
              borderColor: 'var(--neutral-200)',
              borderTopColor: 'var(--brand-primary)'
            }}></div>
            <p style={{fontSize: '0.875rem', color: 'var(--neutral-600)'}}>Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      <div className="container">
        <div className="max-w-7xl mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-heading-xl mb-4" style={{color: 'var(--neutral-900)'}}>
              User Management
            </h1>
            <p className="text-body-lg" style={{color: 'var(--neutral-600)'}}>
              Manage user accounts and verification status
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <p>{error}</p>
              <button 
                onClick={fetchUsers}
                className="btn btn-sm btn-secondary mt-2"
              >
                Retry
              </button>
            </div>
          )}

          {users.length === 0 ? (
            <div className="card text-center">
              <p className="text-body" style={{color: 'var(--neutral-600)'}}>
                No users found
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--neutral-200)'}}>
                      <th className="text-left py-3 px-4 text-body-sm font-semibold" style={{color: 'var(--neutral-700)'}}>Name</th>
                      <th className="text-left py-3 px-4 text-body-sm font-semibold" style={{color: 'var(--neutral-700)'}}>Email</th>
                      <th className="text-left py-3 px-4 text-body-sm font-semibold" style={{color: 'var(--neutral-700)'}}>Verified</th>
                      <th className="text-left py-3 px-4 text-body-sm font-semibold" style={{color: 'var(--neutral-700)'}}>Created</th>
                      <th className="text-left py-3 px-4 text-body-sm font-semibold" style={{color: 'var(--neutral-700)'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{borderBottom: '1px solid var(--neutral-100)'}}>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-body font-medium" style={{color: 'var(--neutral-900)'}}>
                              {user.first_name || 'Unknown'} {user.last_name || 'User'}
                            </p>
                            <p className="text-body-sm" style={{color: 'var(--neutral-500)'}}>
                              ID: {user.id.substring(0, 8)}...
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-body" style={{color: 'var(--neutral-700)'}}>
                            {user.email || 'No email'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {user.identity_verified ? (
                              <div className="badge badge-success">
                                <span className="status-dot status-available"></span>
                                {user.verification_level}
                              </div>
                            ) : (
                              <div className="badge badge-neutral">
                                <span className="status-dot"></span>
                                Not verified
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-body-sm" style={{color: 'var(--neutral-600)'}}>
                            {formatDate(user.created_at)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="btn btn-sm btn-secondary"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                              className="btn btn-sm btn-danger"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-heading-lg mb-4" style={{color: 'var(--neutral-900)'}}>
                  Edit User
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-body-sm font-medium mb-1" style={{color: 'var(--neutral-700)'}}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-body-sm font-medium mb-1" style={{color: 'var(--neutral-700)'}}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-body-sm font-medium mb-1" style={{color: 'var(--neutral-700)'}}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.identity_verified}
                        onChange={(e) => setEditForm({...editForm, identity_verified: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-body-sm" style={{color: 'var(--neutral-700)'}}>
                        Identity Verified
                      </span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-body-sm font-medium mb-1" style={{color: 'var(--neutral-700)'}}>
                      Verification Level
                    </label>
                    <select
                      value={editForm.verification_level}
                      onChange={(e) => setEditForm({...editForm, verification_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="basic">Basic</option>
                      <option value="enhanced">Enhanced</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="btn btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}