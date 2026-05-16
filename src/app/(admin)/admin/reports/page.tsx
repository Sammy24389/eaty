"use client";

import { useState, useEffect } from "react";

export default function AdminReportsPage() {
  const [salesData, setSalesData] = useState<{ total: string; count: number }>({ total: "0", count: 0 });
  const [itemsData, setItemsData] = useState<{ name: string; quantity: number; revenue: string }[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"sales" | "items" | "credit">("sales");

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.set("start", dateRange.start);
      if (dateRange.end) params.set("end", dateRange.end);

      const res = await fetch(`/api/admin/sales-reports?${params}`);
      const data = await res.json();
      setSalesData(data.data || { total: "0", count: 0 });
    } catch {
      console.error("Failed to fetch sales report");
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/items-reports");
      const data = await res.json();
      setItemsData(data.data || []);
    } catch {
      console.error("Failed to fetch items report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sales") fetchSalesReport();
    if (activeTab === "items") fetchItemsReport();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          View sales and performance analytics
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <button
          onClick={fetchSalesReport}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate Report"}
        </button>
      </div>

      <div className="flex gap-2 border-b">
        {(["sales", "items", "credit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "credit" ? "Credit Balance" : `${tab} Report`}
          </button>
        ))}
      </div>

      {activeTab === "sales" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${Number(salesData.total).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {salesData.count}
            </p>
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity Sold
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {itemsData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                itemsData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">${Number(item.revenue).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "credit" && (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          Credit balance report - Coming soon
        </div>
      )}
    </div>
  );
}
