'use client';

import { useTenantDashboard } from '@/hooks/use-tenant-portal';
import Link from 'next/link';
import { Wrench, MessageSquare, Home, Calendar, DollarSign, Phone } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';

export default function TenantDashboardPage() {
  const { data, loading, error } = useTenantDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md">
          <div className="text-center">
            <div className="text-gray-400 text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold mb-2">No Active Tenancy</h2>
            <p className="text-gray-600">
              You don't have an active tenancy. Please contact your property manager.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Tenant Portal! 🏠</h1>
        <p className="text-blue-100">
          Manage your maintenance requests, communicate with your property manager, and view your lease information.
        </p>
      </div>

      {/* Property Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-5 w-5 text-gray-600" />
              <h2 className="text-2xl font-bold">{data.property.name}</h2>
            </div>
            <p className="text-gray-600">
              {data.property.address}, {data.property.city}, {data.property.state} {data.property.zipCode}
            </p>
          </div>
          <StatusBadge status={data.occupancy.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Home className="h-4 w-4" />
              <span className="text-sm font-medium">Unit</span>
            </div>
            <p className="text-lg font-semibold">
              {data.occupancy.unitNumber || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Move-in Date</span>
            </div>
            <p className="text-lg font-semibold">
              {data.occupancy.moveInDate
                ? format(new Date(data.occupancy.moveInDate), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Lease Ends</span>
            </div>
            <p className="text-lg font-semibold">
              {data.occupancy.leaseEndDate
                ? format(new Date(data.occupancy.leaseEndDate), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Monthly Rent</span>
            </div>
            <p className="text-lg font-semibold">
              {data.occupancy.rentAmount
                ? `$${data.occupancy.rentAmount.toLocaleString()}`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/tenant/maintenance/new">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-500">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <Wrench className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Report Maintenance</h3>
                <p className="text-sm text-gray-600">Submit a maintenance request</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/tenant/messages/new">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-green-500">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-lg">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold mb-1">Message Manager</h3>
                  {data.unreadMessages > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {data.unreadMessages}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Send a message to your property manager</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Maintenance Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Maintenance Requests</h3>
          <Link href="/tenant/maintenance" className="text-sm text-blue-600 hover:text-blue-700">
            View All
          </Link>
        </div>

        {data.workOrders.length === 0 ? (
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No maintenance requests yet</p>
            <Link href="/tenant/maintenance/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Wrench className="h-4 w-4" />
              Submit First Request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.workOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{order.title}</h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Manager Contact */}
      {data.manager && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Property Manager Contact</h3>
          </div>
          <div className="space-y-2">
            <p className="font-medium">
              {data.manager.firstName} {data.manager.lastName}
            </p>
            <p className="text-sm text-gray-600">{data.manager.email}</p>
            {data.manager.phone && (
              <p className="text-sm text-gray-600">
                Emergency: <a href={`tel:${data.manager.phone}`} className="text-blue-600 hover:underline">
                  {data.manager.phone}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
