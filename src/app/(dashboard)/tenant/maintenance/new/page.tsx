'use client';

import { useState } from 'react';
import { useSubmitWorkOrder } from '@/hooks/use-tenant-portal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wrench, AlertCircle } from 'lucide-react';

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const { submit, loading } = useSubmitWorkOrder();
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'MAINTENANCE',
    priority: 'MEDIUM',
    tenantNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    const result = await submit(formData);
    
    if (result.success) {
      router.push('/tenant');
    } else {
      setError(result.error || 'Failed to submit request');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/tenant"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Submit Maintenance Request</h1>
            <p className="text-sm text-gray-600">Describe the issue and we'll address it promptly</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Leaky faucet in kitchen"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="MAINTENANCE">General Maintenance</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="HVAC">Heating/Cooling (HVAC)</option>
              <option value="APPLIANCE">Appliance</option>
              <option value="PEST_CONTROL">Pest Control</option>
              <option value="CLEANING">Cleaning</option>
              <option value="LANDSCAPING">Landscaping</option>
              <option value="SECURITY">Security</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="LOW">Low - Can wait</option>
              <option value="MEDIUM">Medium - Should be addressed soon</option>
              <option value="HIGH">High - Needs prompt attention</option>
              <option value="URGENT">Urgent - Emergency</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select "Urgent" for emergencies like water leaks, no heat/AC, or security issues
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please describe the issue in detail..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.tenantNotes}
              onChange={(e) => setFormData({ ...formData, tenantNotes: e.target.value })}
              placeholder="Any additional information that might help..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link
              href="/tenant"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Emergency Contact Info */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">🚨 Emergency?</h3>
        <p className="text-sm text-amber-700">
          For life-threatening emergencies or situations requiring immediate attention (fire, flood, gas leak), 
          please call emergency services (911) first, then contact your property manager directly by phone.
        </p>
      </div>
    </div>
  );
}
