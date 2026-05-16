"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Slider {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  isActive: boolean;
  order: number;
}

export default function AdminSlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    order: "0",
    isActive: true,
  });

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sliders");
      const data = await res.json();
      setSliders(data.data || []);
    } catch {
      console.error("Failed to fetch sliders");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSlider
        ? `/api/admin/sliders?id=${editingSlider.id}`
        : "/api/admin/sliders";
      const method = editingSlider ? "PATCH" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setShowModal(false);
      setEditingSlider(null);
      setFormData({ title: "", description: "", image: "", link: "", order: "0", isActive: true });
      fetchSliders();
    } catch {
      console.error("Failed to save slider");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/admin/sliders?id=${id}`, { method: "DELETE" });
      fetchSliders();
    } catch {
      console.error("Failed to delete slider");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sliders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage slider images
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSlider(null);
            setFormData({ title: "", description: "", image: "", link: "", order: "0", isActive: true });
            setShowModal(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Add Slider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
        ) : sliders.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">No sliders found</div>
        ) : (
          sliders.map((slider) => (
            <div key={slider.id} className="bg-white rounded-lg border overflow-hidden">
              <div className="relative h-48 bg-gray-100">
                {slider.image ? (
                  <Image src={slider.image} alt={slider.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{slider.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${slider.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {slider.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{slider.description}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEditingSlider(slider); setFormData({ title: slider.title, description: slider.description || "", image: slider.image || "", link: slider.link || "", order: slider.order?.toString() || "0", isActive: slider.isActive }); setShowModal(true); }} className="text-blue-600 hover:underline text-sm">Edit</button>
                  <button onClick={() => handleDelete(slider.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingSlider ? "Edit Slider" : "Add Slider"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium mb-1">Image URL</label><input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium mb-1">Link URL</label><input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium mb-1">Order</label><input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" /><label htmlFor="isActive" className="text-sm">Active</label></div>
              <div className="flex gap-3 pt-2"><button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90">{editingSlider ? "Update" : "Create"}</button><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
