"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Bike,
  Store,
  Settings,
  Tag,
  Gift,
  MessageSquare,
  Image,
  FileText,
  CreditCard,
  Shield,
  Monitor,
  Bell,
  BarChart3,
  ChevronDown,
  MonitorCheck,
  History,
} from "lucide-react";
import { useState } from "react";

const navSections = [
  {
    label: "Main",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
      { href: "/admin/kds", icon: Monitor, label: "KDS" },
      { href: "/admin/pos", icon: MonitorCheck, label: "POS Terminal" },
      { href: "/admin/pos-history", icon: History, label: "POS History" },
    ],
  },
  {
    label: "Menu",
    items: [
      { href: "/admin/items", icon: Package, label: "Items" },
      { href: "/admin/categories", icon: Tag, label: "Categories" },
      { href: "/admin/coupons", icon: Gift, label: "Coupons" },
      { href: "/admin/offers", icon: Gift, label: "Offers" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/customers", icon: Users, label: "Customers" },
      { href: "/admin/delivery-boys", icon: Bike, label: "Delivery Boys" },
      { href: "/admin/roles", icon: Shield, label: "Roles" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/branches", icon: Store, label: "Branches" },
      { href: "/admin/payment-gateways", icon: CreditCard, label: "Payments" },
      { href: "/admin/settings", icon: Settings, label: "General" },
      { href: "/admin/sliders", icon: Image, label: "Sliders" },
      { href: "/admin/pages", icon: FileText, label: "Pages" },
      { href: "/admin/notifications", icon: Bell, label: "Notifications" },
      { href: "/admin/messages", icon: MessageSquare, label: "Messages" },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/admin/reports", icon: BarChart3, label: "Reports" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Main: true,
    Menu: true,
    People: true,
    Settings: false,
    Reports: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 h-screen overflow-y-auto sticky top-0">
      <div className="p-4 border-b border-gray-800">
        <Link href="/admin/dashboard" className="text-xl font-bold text-white">
          FoodAppi Admin
        </Link>
      </div>

      <nav className="p-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <button
              onClick={() => toggleSection(section.label)}
              className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 hover:text-gray-300"
            >
              {section.label}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openSections[section.label] ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections[section.label] && (
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-primary text-white"
                            : "hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
