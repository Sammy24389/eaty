"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Globe } from "lucide-react";
import { locales } from "@/lib/i18n/translations";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full">
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{locale}</span>
      </button>

      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
        {locales.map((loc) => (
          <button
            key={loc.code}
            onClick={() => setLocale(loc.code)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
              loc.code === locale ? "bg-primary text-white" : ""
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
