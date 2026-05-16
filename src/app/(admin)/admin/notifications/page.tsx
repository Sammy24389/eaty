"use client";

import { useState } from "react";

export default function AdminNotificationsPage() {
  const [formData, setFormData] = useState({ title: "", message: "", sendTo: "all", branchId: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setSent(true);
      setFormData({ title: "", message: "", sendTo: "all", branchId: "" });
      setTimeout(() => setSent(false), 3000);
    } catch {
      console.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Send push notifications to users</p>
      </div>

      {sent && <div className="bg-green-50 text-green-600 p-4 rounded-lg">Notification sent successfully!</div>}

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSend} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="block text-sm font-medium mb-1">Message</label><textarea required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="block text-sm font-medium mb-1">Send To</label><select value={formData.sendTo} onChange={(e) => setFormData({ ...formData, sendTo: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"><option value="all">All Users</option><option value="customers">Customers Only</option><option value="delivery_boys">Delivery Boys Only</option></select></div>
          <button type="submit" disabled={sending} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50">{sending ? "Sending..." : "Send Notification"}</button>
        </form>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Notification History</h2>
        <p className="text-gray-500 text-sm">Recent notifications will appear here.</p>
      </div>
    </div>
  );
}
