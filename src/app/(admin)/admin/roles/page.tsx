"use client";

import { useState, useEffect } from "react";

interface Role {
  id: string;
  name: string;
  guardName: string;
  permissions: string[];
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", permissions: [] as string[] });

  const allPermissions = [
    "view-dashboard", "manage-orders", "manage-items", "manage-categories",
    "manage-customers", "manage-delivery-boys", "manage-settings", "manage-reports",
    "manage-coupons", "manage-offers", "manage-messages", "manage-notifications",
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      setRoles(data.data || []);
    } catch {
      console.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ name: "", permissions: [] });
      fetchRoles();
    } catch {
      console.error("Failed to create role");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/admin/roles?id=${id}`, { method: "DELETE" });
      fetchRoles();
    } catch {
      console.error("Failed to delete role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Roles</h1><p className="text-sm text-gray-500 mt-1">Manage user roles and permissions</p></div>
        <button onClick={() => { setFormData({ name: "", permissions: [] }); setShowModal(true); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">Add Role</button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (<tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>) : roles.length === 0 ? (<tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No roles found</td></tr>) : (roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium capitalize">{role.name}</td>
                <td className="px-4 py-3 text-sm">{role.permissions?.length || 0} permissions</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(role.id)} className="text-red-600 hover:underline text-sm">Delete</button></td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between"><h2 className="text-lg font-semibold">Add Role</h2><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button></div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Role Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allPermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-2"><input type="checkbox" checked={formData.permissions.includes(perm)} onChange={(e) => setFormData({ ...formData, permissions: e.target.checked ? [...formData.permissions, perm] : formData.permissions.filter((p) => p !== perm) })} className="w-4 h-4" /><span className="text-sm capitalize">{perm.replace(/-/g, " ")}</span></label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2"><button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90">Create</button><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
