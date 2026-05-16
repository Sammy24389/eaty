"use client";

import { useState, useEffect } from "react";

interface Gateway {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  credentials: Record<string, string>;
}

export default function AdminPaymentGatewaysPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-gateways");
      const data = await res.json();
      setGateways(data.data || []);
    } catch {
      console.error("Failed to fetch gateways");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingGateway) return;
    try {
      await fetch(`/api/admin/payment-gateways?id=${editingGateway.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials, isActive: editingGateway.isActive }),
      });
      setShowModal(false);
      setEditingGateway(null);
      fetchGateways();
    } catch {
      console.error("Failed to save gateway");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/payment-gateways?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      fetchGateways();
    } catch {
      console.error("Failed to toggle gateway");
    }
  };

  const gatewayFields: Record<string, string[]> = {
    paystack: ["public_key", "secret_key"],
    flutterwave: ["public_key", "secret_key", "encryption_key"],
    stripe: ["publishable_key", "secret_key"],
    razorpay: ["key_id", "key_secret"],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Gateways</h1>
        <p className="text-sm text-gray-500 mt-1">Configure payment methods</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
        ) : gateways.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">No gateways configured</div>
        ) : (
          gateways.map((gateway) => (
            <div key={gateway.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg capitalize">{gateway.name}</h3>
                  <p className="text-sm text-gray-500">{gateway.type}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={gateway.isActive} onChange={(e) => handleToggle(gateway.id, e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <button onClick={() => { setEditingGateway(gateway); setCredentials(gateway.credentials || {}); setShowModal(true); }} className="mt-4 text-primary hover:underline text-sm">Configure</button>
            </div>
          ))
        )}
      </div>

      {showModal && editingGateway && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between"><h2 className="text-lg font-semibold capitalize">Configure {editingGateway.name}</h2><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button></div>
            <div className="p-4 space-y-4">
              {(gatewayFields[editingGateway.type] || ["api_key", "secret"]).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1 capitalize">{field.replace(/_/g, " ")}</label>
                  <input type="password" value={credentials[field] || ""} onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div className="flex gap-3 pt-2"><button onClick={handleSave} className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90">Save</button><button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
