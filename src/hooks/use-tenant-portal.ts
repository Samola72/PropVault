import { useState, useEffect } from "react";

interface TenantDashboardData {
  occupancy: {
    id: string;
    unitNumber: string | null;
    moveInDate: string | null;
    leaseEndDate: string | null;
    rentAmount: number | null;
    status: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string | null;
    type: string;
  };
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  workOrders: any[];
  unreadMessages: number;
  recentActivity: any[];
}

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  completed_date: string | null;
  submitted_by_tenant: boolean;
  tenant_notes: string | null;
}

interface Message {
  id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  recipient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function useTenantDashboard() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant-portal/dashboard");
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}

export function useTenantWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant-portal/work-orders");
      
      if (!response.ok) {
        throw new Error("Failed to fetch work orders");
      }

      const data = await response.json();
      setWorkOrders(data.workOrders || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const submitWorkOrder = async (workOrderData: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
    tenantNotes?: string;
  }) => {
    try {
      const response = await fetch("/api/tenant-portal/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workOrderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit work order");
      }

      const result = await response.json();
      await fetchWorkOrders(); // Refresh list
      return result;
    } catch (err) {
      throw err;
    }
  };

  return {
    workOrders,
    loading,
    error,
    submitWorkOrder,
    refetch: fetchWorkOrders,
  };
}

export function useTenantMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant-portal/messages");
      
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData: {
    subject: string;
    content: string;
  }) => {
    try {
      const response = await fetch("/api/tenant-portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const result = await response.json();
      await fetchMessages(); // Refresh list
      return result;
    } catch (err) {
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
}

export function useInviteTenant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteTenant = async (occupantId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tenant-portal/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occupantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    inviteTenant,
    loading,
    error,
  };
}

export function useRegisterTenant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerTenant = async (registrationData: {
    token: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tenant-portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    registerTenant,
    loading,
    error,
  };
}

// Convenience hook for submitting work orders
export function useSubmitWorkOrder() {
  const [loading, setLoading] = useState(false);

  const submit = async (workOrderData: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
    tenantNotes?: string;
  }) => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant-portal/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workOrderData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to submit work order" };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
}

// Convenience hook for sending messages
export function useSendMessage() {
  const [loading, setLoading] = useState(false);

  const send = async (messageData: { subject: string; content: string }) => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant-portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to send message" };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  return { send, loading };
}
