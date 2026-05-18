"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/lib/store/cart";
import { useLanguage } from "@/lib/i18n/context";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { user } = useAuth();
  const { itemCount } = useCartStore();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-primary">
            FoodAppi
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm hover:text-primary">
              {t("home")}
            </Link>
            <Link href="/items" className="text-sm hover:text-primary">
              {t("menu")}
            </Link>
            <Link href="/offers" className="text-sm hover:text-primary">
              {t("offers")}
            </Link>
            <Link href="/contact" className="text-sm hover:text-primary">
              {t("contact")}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium hover:text-primary">
                {t("login")}
              </Link>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-3">
              <Link href="/" className="text-sm hover:text-primary" onClick={() => setMobileOpen(false)}>
                {t("home")}
              </Link>
              <Link href="/items" className="text-sm hover:text-primary" onClick={() => setMobileOpen(false)}>
                {t("menu")}
              </Link>
              <Link href="/offers" className="text-sm hover:text-primary" onClick={() => setMobileOpen(false)}>
                {t("offers")}
              </Link>
              <Link href="/contact" className="text-sm hover:text-primary" onClick={() => setMobileOpen(false)}>
                {t("contact")}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
