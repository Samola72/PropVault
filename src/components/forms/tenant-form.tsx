"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/modal";
import { Loader2 } from "lucide-react";

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TenantForm({ isOpen, onClose, onSuccess }: TenantFormProps) {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    property_id: "",
    full_name: "",
    email: "",
    phone: "",
    lease_start: "",
    lease_end: "",
    monthly_rent: "",
  });

  // Fetch properties
  useEffect(() => {
    if (isOpen) {
      fetch("/api/properties")
        .then(res => res.json())
        .then(data => setProperties(data.data || []));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          monthly_rent: parseFloat(formData.monthly_rent),
        }),
      });

      if (!response.ok) throw new Error("Failed to create tenant");

      // Reset form
      setFormData({
        property_id: "",
        full_name: "",
        email: "",
        phone: "",
        lease_start: "",
        lease_end: "",
        monthly_rent: "",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating tenant:", error);
      alert("Failed to create tenant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Add New Tenant" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Property */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property *
            </label>
            <select
              required
              value={formData.property_id}
              onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a property</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Full Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Lease Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lease Start Date *
            </label>
            <input
              type="date"
              required
              value={formData.lease_start}
              onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lease End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lease End Date *
            </label>
            <input
              type="date"
              required
              value={formData.lease_end}
              onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Monthly Rent */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Rent *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.monthly_rent}
              onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1500.00"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Add Tenant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
