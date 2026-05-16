"use client";

import Image from "next/image";
import { useCartStore } from "@/lib/store/cart";
import { Plus, Minus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  };
}

export default function CartItemCard({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border">
      {item.image && (
        <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{item.name}</h3>
        <p className="text-primary font-semibold mt-1">
          ${(item.price * item.quantity).toFixed(2)}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => removeItem(item.itemId)}
            className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
