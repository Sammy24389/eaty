import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/admin/dashboard`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getRecentOrders() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/admin/online-orders?limit=5`,
      { next: { revalidate: 10 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function AdminDashboardPage() {
  const dashboardData = await getDashboardData();
  const recentOrders = await getRecentOrders();

  const stats = [
    {
      label: "Total Orders",
      value: dashboardData?.totalOrders || "0",
      icon: ShoppingCart,
      color: "bg-blue-500",
      change: dashboardData?.orderChange,
    },
    {
      label: "Total Sales",
      value: dashboardData?.totalSales
        ? `$${Number(dashboardData.totalSales).toFixed(2)}`
        : "$0.00",
      icon: DollarSign,
      color: "bg-green-500",
      change: dashboardData?.salesChange,
    },
    {
      label: "Total Customers",
      value: dashboardData?.totalCustomers || "0",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      label: "Menu Items",
      value: dashboardData?.totalItems || "0",
      icon: Package,
      color: "bg-orange-500",
    },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your food delivery business
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg ${stat.color} p-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.change !== undefined && (
                <div
                  className={`flex items-center text-sm ${
                    stat.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <p className="mt-4 text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="divide-y">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No orders yet
              </div>
            ) : (
              recentOrders.map(
                (order: {
                  id: string;
                  orderNumber: string;
                  customerName: string;
                  status: string;
                  total: string;
                  createdAt: string;
                }) => (
                  <div key={order.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {order.customerName || "Guest"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                      <p className="text-sm font-medium mt-1">
                        ${Number(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link
              href="/admin/items"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Add Item</span>
            </Link>
            <Link
              href="/admin/orders"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <span className="text-sm font-medium">Manage Orders</span>
            </Link>
            <Link
              href="/admin/customers"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <span className="text-sm font-medium">Customers</span>
            </Link>
            <Link
              href="/admin/settings"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
