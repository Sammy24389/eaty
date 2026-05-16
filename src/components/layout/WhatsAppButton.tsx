"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const { items, total } = useCartStore();
  const [sending, setSending] = useState(false);

  const sendWhatsAppOrder = () => {
    if (items.length === 0) return;
    setSending(true);

    const orderText = items
      .map((item) => `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");

    const message = `🛒 *New Order*\n\n${orderText}\n\n💰 *Total: $${total.toFixed(2)}*\n\nPlease confirm my order.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    setSending(false);
  };

  if (items.length === 0) return null;

  return (
    <button
      onClick={sendWhatsAppOrder}
      disabled={sending}
      className="fixed bottom-20 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2 z-40"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-medium hidden sm:inline">Order via WhatsApp</span>
    </button>
  );
}
