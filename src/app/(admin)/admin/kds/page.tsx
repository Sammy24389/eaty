"use client";

import { useState, useEffect } from "react";

interface KdsOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; instruction?: string }[];
  status: string;
  createdAt: string;
  branchName: string;
}

export default function AdminKdsPage() {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kds-orders?status=${filter}`);
      const data = await res.json();
      setOrders(data.data || []);
    } catch {
      console.error("Failed to fetch KDS orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/admin/kds-orders?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch {
      console.error("Failed to update order");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "border-yellow-500 bg-yellow-50",
    confirmed: "border-blue-500 bg-blue-50",
    processing: "border-purple-500 bg-purple-50",
    ready: "border-green-500 bg-green-50",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1><p className="text-sm text-gray-500 mt-1">Manage incoming orders</p></div>
        <div className="flex gap-2">
          {["pending", "confirmed", "processing", "ready"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${filter === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No orders in this status</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className={`rounded-lg border-2 p-4 ${statusColors[order.status] || "border-gray-200 bg-white"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">#{order.orderNumber}</h3>
                <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{order.customerName || "Guest"}</p>
              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="font-bold text-primary">{item.quantity}x</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.instruction && <p className="text-xs text-red-500 italic">{item.instruction}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {filter === "pending" && (<button onClick={() => updateStatus(order.id, "confirmed")} className="flex-1 bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600">Confirm</button>)}
                {filter === "confirmed" && (<button onClick={() => updateStatus(order.id, "processing")} className="flex-1 bg-purple-500 text-white py-2 rounded text-sm hover:bg-purple-600">Start Prep</button>)}
                {filter === "processing" && (<button onClick={() => updateStatus(order.id, "ready")} className="flex-1 bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600">Mark Ready</button>)}
                {filter === "ready" && (<button onClick={() => updateStatus(order.id, "delivered")} className="flex-1 bg-gray-500 text-white py-2 rounded text-sm hover:bg-gray-600">Complete</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
