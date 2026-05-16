"use client";

import { useState, useEffect } from "react";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({ title: "", slug: "", content: "", isActive: true });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages");
      const data = await res.json();
      setPages(data.data || []);
    } catch {
      console.error("Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPage ? `/api/admin/pages?id=${editingPage.id}` : "/api/admin/pages";
      const method = editingPage ? "PATCH" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      setShowModal(false);
      setEditingPage(null);
      setFormData({ title: "", slug: "", content: "", isActive: true });
      fetchPages();
    } catch {
      console.error("Failed to save page");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/admin/pages?id=${id}`, { method: "DELETE" });
      fetchPages();
    } catch {
      console.error("Failed to delete page");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Pages</h1><p className="text-sm text-gray-500 mt-1">Manage static pages (About, Privacy, etc.)</p></div>
        <button onClick={() => { setEditingPage(null); setFormData({ title: "", slug: "", content: "", isActive: true }); setShowModal(true); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">Add Page</button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>) : pages.length === 0 ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No pages found</td></tr>) : (pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3 text-sm font-mono">{page.slug}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${page.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{page.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => { setEditingPage(page); setFormData({ title: page.title, slug: page.slug, content: page.content || "", isActive: page.isActive }); setShowModal(true); }} className="text-blue-600 hover:underline text-sm">Edit</button><button onClick={() => handleDelete(page.id)} className="text-red-600 hover:underline text-sm">Delete</button></div></td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between"><h2 className="text-lg font-semibold">{editingPage ? "Edit Page" : "Add Page"}</h2><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button></div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono" /></div>
              <div><label className="block text-sm font-medium mb-1">Content</label><textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" /><label htmlFor="isActive" className="text-sm">Active</label></div>
              <div className="flex gap-3 pt-2"><button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90">{editingPage ? "Update" : "Create"}</button><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
