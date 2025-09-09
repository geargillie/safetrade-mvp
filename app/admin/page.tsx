/**
 * Admin Dashboard with Safe Zone Management
 * Central admin interface for managing users, safe zones, and system settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Shield, MapPin, BarChart3, AlertTriangle, Settings,
  CheckCircle, XCircle, Clock, TrendingUp, Activity, Database,
  Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2
} from 'lucide-react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeZone, SafeZoneStatus, SafeZoneType } from '@/types/safe-zones';
import { supabase } from '@/lib/supabase';

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalSafeZones: number;
  verifiedSafeZones: number;
  totalMeetings: number;
  activeMeetings: number;
  safetyIncidents: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    totalSafeZones: 0,
    verifiedSafeZones: 0,
    totalMeetings: 0,
    activeMeetings: 0,
    safetyIncidents: 0,
    systemHealth: 'healthy'
  });
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'safezones' | 'meetings' | 'system'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchSafeZones();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login?redirectTo=/admin');
        return;
      }

      // In a real app, you'd check admin permissions here
      setUser(user);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login?redirectTo=/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch various system statistics
      const [
        { count: totalUsers },
        { count: verifiedUsers },
        { count: totalSafeZones },
        { count: verifiedSafeZones },
        { count: totalMeetings },
        { count: activeMeetings }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('identity_verified', true),
        supabase.from('safe_zones').select('*', { count: 'exact', head: true }),
        supabase.from('safe_zones').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('safe_zone_meetings').select('*', { count: 'exact', head: true }),
        supabase.from('safe_zone_meetings').select('*', { count: 'exact', head: true }).in('status', ['scheduled', 'confirmed', 'in_progress'])
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        totalSafeZones: totalSafeZones || 0,
        verifiedSafeZones: verifiedSafeZones || 0,
        totalMeetings: totalMeetings || 0,
        activeMeetings: activeMeetings || 0,
        safetyIncidents: 2, // Placeholder
        systemHealth: 'healthy'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSafeZones = async () => {
    try {
      const { data, error } = await supabase
        .from('safe_zones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSafeZones(data || []);
    } catch (error) {
      console.error('Error fetching safe zones:', error);
    }
  };

  const handleSafeZoneStatusChange = async (safeZoneId: string, newStatus: SafeZoneStatus) => {
    try {
      const { error } = await supabase
        .from('safe_zones')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', safeZoneId);

      if (error) throw error;

      // Refresh safe zones
      fetchSafeZones();
      fetchStats();
    } catch (error) {
      console.error('Error updating safe zone status:', error);
    }
  };

  const getStatusBadge = (status: SafeZoneStatus) => {
    const variants: Record<SafeZoneStatus, string> = {
      [SafeZoneStatus.ACTIVE]: 'bg-orange-100 text-orange-800 border-orange-200',
      [SafeZoneStatus.INACTIVE]: 'bg-gray-100 text-gray-800 border-gray-200',
      [SafeZoneStatus.TEMPORARILY_CLOSED]: 'bg-orange-100 text-orange-800 border-orange-200',
      [SafeZoneStatus.PENDING_VERIFICATION]: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <Badge className={variants[status] || variants[SafeZoneStatus.INACTIVE]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeLabel = (type: SafeZoneType): string => {
    const labels: Record<SafeZoneType, string> = {
      [SafeZoneType.POLICE_STATION]: 'Police Station',
      [SafeZoneType.FIRE_STATION]: 'Fire Station',
      [SafeZoneType.HOSPITAL]: 'Hospital',
      [SafeZoneType.LIBRARY]: 'Library',
      [SafeZoneType.COMMUNITY_CENTER]: 'Community Center',
      [SafeZoneType.GOVERNMENT_BUILDING]: 'Government Building',
      [SafeZoneType.MALL]: 'Shopping Center',
      [SafeZoneType.BANK]: 'Bank',
      [SafeZoneType.RETAIL_STORE]: 'Retail Store',
      [SafeZoneType.OTHER]: 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <div className="page-wrapper dashboard-page">
      <Layout showNavigation={true}>
        {/* Page Header */}
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-description">Manage SafeTrade platform and safety features</p>
            
            <div className="flex items-center gap-3 mt-4">
              <Badge 
                className={`${
                  stats.systemHealth === 'healthy' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                  stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                <Activity className="w-3 h-3 mr-1" />
                System {stats.systemHealth}
              </Badge>
            </div>
          </div>
        </div>

        <div className="page-content">
          <div className="container">
            {/* Dashboard Header */}
            <div className="dashboard-header content-block">
              {/* Stats Grid */}
              <div className="stats-grid">
                {/* Users */}
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                  <div className="text-xs text-green-600 mt-1">
                    {stats.verifiedUsers} verified ({Math.round((stats.verifiedUsers / stats.totalUsers) * 100) || 0}%)
                  </div>
                </div>

                {/* Safe Zones */}
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="stat-value">{stats.totalSafeZones}</div>
                  <div className="stat-label">Safe Zones</div>
                  <div className="text-xs text-green-600 mt-1">
                    {stats.verifiedSafeZones} verified ({Math.round((stats.verifiedSafeZones / stats.totalSafeZones) * 100) || 0}%)
                  </div>
                </div>

                {/* Meetings */}
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="stat-value">{stats.totalMeetings}</div>
                  <div className="stat-label">Total Meetings</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {stats.activeMeetings} currently active
                  </div>
                </div>

                {/* Safety */}
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    {stats.safetyIncidents === 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="stat-value">{stats.safetyIncidents}</div>
                  <div className="stat-label">Safety Incidents</div>
                  <div className="text-xs text-gray-600 mt-1">Last 30 days</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 element-group">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'safezones', label: 'Safe Zones', icon: Shield },
                  { id: 'meetings', label: 'Meetings', icon: MapPin },
                  { id: 'system', label: 'System', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2" style={{gap: 'var(--space-2xl)'}}>
              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { type: 'user', message: 'New user registration', time: '2 minutes ago' },
                    { type: 'safezone', message: 'Safe zone verified: Central Library', time: '15 minutes ago' },
                    { type: 'meeting', message: 'Meeting completed successfully', time: '1 hour ago' },
                    { type: 'safety', message: 'Safety check-in received', time: '2 hours ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'safezone' ? 'bg-orange-100 text-green-600' :
                        activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {activity.type === 'user' ? <Users className="w-4 h-4" /> :
                         activity.type === 'safezone' ? <Shield className="w-4 h-4" /> :
                         activity.type === 'meeting' ? <MapPin className="w-4 h-4" /> :
                         <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{activity.message}</div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" asChild>
                    <Link href="/admin/safe-zones/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Safe Zone
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin/users">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin/reports">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Reports
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin/system">
                      <Settings className="w-4 h-4 mr-2" />
                      System Settings
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safezones' && (
            <div>
              <div className="flex items-center justify-between element-group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search safe zones..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <Button asChild>
                  <Link href="/admin/safe-zones/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Safe Zone
                  </Link>
                </Button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Name</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Type</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Rating</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Meetings</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {safeZones
                        .filter(sz => 
                          searchQuery === '' || 
                          sz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sz.address.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((safeZone) => (
                        <tr key={safeZone.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-900">{safeZone.name}</div>
                              <div className="text-sm text-gray-600">{safeZone.address}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              {getTypeLabel(safeZone.zoneType)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(safeZone.status)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">
                                {safeZone.averageRating?.toFixed(1) || 'N/A'}
                              </span>
                              {safeZone.averageRating && (
                                <div className="flex items-center">
                                  <span className="text-yellow-400">★</span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({safeZone.totalReviews})
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-900">0</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/safe-zones/${safeZone.id}`}>
                                  <Eye className="w-3 h-3" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/safe-zones/${safeZone.id}/edit`}>
                                  <Edit className="w-3 h-3" />
                                </Link>
                              </Button>
                              <select
                                value={safeZone.status}
                                onChange={(e) => handleSafeZoneStatusChange(safeZone.id, e.target.value as SafeZoneStatus)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-lg border border-gray-200 text-center" style={{padding: 'var(--space-2xl)'}}>
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 mb-4">Manage user accounts, verification status, and permissions.</p>
              <Button asChild>
                <Link href="/admin/users">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="bg-white rounded-lg border border-gray-200 text-center" style={{padding: 'var(--space-2xl)'}}>
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Meeting Management</h3>
              <p className="text-gray-600 mb-4">Monitor ongoing meetings, safety check-ins, and incidents.</p>
              <Button>
                <MapPin className="w-4 h-4 mr-2" />
                View Active Meetings
              </Button>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="grid grid-cols-1 lg:grid-cols-2" style={{gap: 'var(--space-2xl)'}}>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Database</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">API Services</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Safety Systems</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">Healthy</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Database Maintenance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Update System Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Safety System Check
                  </Button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </Layout>
    </div>
  );
}