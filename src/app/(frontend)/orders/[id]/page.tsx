import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

async function getOrder(orderId: string, userId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/orders?id=${orderId}&userId=${userId}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const order = await getOrder(id, session.user.id);
  if (!order) notFound();

  const statusSteps = [
    { key: "pending", label: "Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Preparing" },
    { key: "out_for_delivery", label: "On the Way" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentStatusIndex = statusSteps.findIndex(
    (s) => s.key === order.status
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/orders" className="hover:text-primary">My Orders</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">#{order.orderNumber}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-6">Order #{order.orderNumber}</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Status</h2>
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStatusIndex
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index <= currentStatusIndex ? "✓" : index + 1}
              </div>
              <span className="ml-2 text-xs hidden sm:block">{step.label}</span>
              {index < statusSteps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStatusIndex ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="space-y-3">
            {(order.items || []).map((item: { name: string; quantity: number; price: number }) => (
              <div key={item.name} className="flex justify-between text-sm">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${Number(order.subtotal || order.total).toFixed(2)}</span>
              </div>
              {order.deliveryFee && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${Number(order.deliveryFee).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Payment: </span>
                <span>{order.paymentMethod || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Status: </span>
                <span className="capitalize">{order.status}</span>
              </div>
              <div>
                <span className="text-gray-500">Date: </span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              {order.address && (
                <div>
                  <span className="text-gray-500">Address: </span>
                  <span>{order.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
