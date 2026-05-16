"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      const settingsMap: Record<string, string> = {};
      (data.data || []).forEach((s: { key: string; payload: string }) => {
        settingsMap[s.key] = typeof s.payload === "string" ? s.payload : JSON.stringify(s.payload);
      });
      setSettings(settingsMap);
    } catch {
      console.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      console.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  const sections = [
    {
      title: "General",
      fields: [
        { key: "site_name", label: "Site Name", type: "text" },
        { key: "site_email", label: "Email", type: "email" },
        { key: "site_phone", label: "Phone", type: "text" },
        { key: "site_address", label: "Address", type: "text" },
        { key: "currency_code", label: "Currency Code", type: "text" },
        { key: "currency_symbol", label: "Currency Symbol", type: "text" },
      ],
    },
    {
      title: "Order Settings",
      fields: [
        { key: "delivery_fee", label: "Delivery Fee", type: "number" },
        { key: "minimum_order", label: "Minimum Order", type: "number" },
        { key: "tax_percentage", label: "Tax %", type: "number" },
        { key: "order_prefix", label: "Order Prefix", type: "text" },
      ],
    },
    {
      title: "Social",
      fields: [
        { key: "facebook_url", label: "Facebook URL", type: "url" },
        { key: "twitter_url", label: "Twitter URL", type: "url" },
        { key: "instagram_url", label: "Instagram URL", type: "url" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your application settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm">Settings saved!</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={settings[field.key] || ""}
                  onChange={(e) => updateSetting(field.key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
