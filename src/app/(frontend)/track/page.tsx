"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, Clock, Phone } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  createdAt: string;
  address?: { address: string };
  deliveryBoy?: { name: string; phone: string };
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "processing", label: "Preparing", icon: "👨‍🍳" },
  { key: "out_for_delivery", label: "On the Way", icon: "🚗" },
  { key: "delivered", label: "Delivered", icon: "📦" },
];

export default function OrderTrackingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!session) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || params.get("orderId");
    if (id) {
      setOrderId(id);
      fetchOrder(id);
    }
  }, [session]);

  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(() => fetchOrder(orderId), 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/frontend/orders?id=${id}`);
      const data = await res.json();
      if (data.data) setOrder(data.data);
    } catch {
      console.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Login Required</h1>
        <Link href="/login" className="inline-block bg-primary text-white px-6 py-2 rounded-lg">Login</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-gray-500 mb-6">Enter your order number to track it.</p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order number..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => orderId && fetchOrder(orderId)}
            className="bg-primary text-white px-4 py-2 rounded-lg"
          >
            Track
          </button>
        </div>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-6">Order Progress</h2>
        <div className="space-y-6">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            return (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isCompleted ? "bg-primary text-white" : "bg-gray-200"
                    }`}
                  >
                    {isCompleted ? step.icon : "○"}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-2 ${
                        isCompleted ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
                <div className="pt-1">
                  <p
                    className={`font-medium ${
                      isCurrent ? "text-primary" : isCompleted ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> In progress...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {order.address && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Delivery Address
          </h2>
          <p className="text-sm text-gray-600">{order.address.address}</p>
        </div>
      )}

      {order.deliveryBoy && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Delivery Partner
          </h2>
          <p className="text-sm">{order.deliveryBoy.name}</p>
          {order.deliveryBoy.phone && (
            <a
              href={`tel:${order.deliveryBoy.phone}`}
              className="text-sm text-primary hover:underline"
            >
              {order.deliveryBoy.phone}
            </a>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold mb-3">Order Total</h2>
        <p className="text-2xl font-bold text-primary">${Number(order.total).toFixed(2)}</p>
        <p className="text-sm text-gray-500 mt-1">
          Payment: {order.paymentStatus === "10" ? "Paid" : "Pending"}
        </p>
      </div>
    </div>
  );
}
