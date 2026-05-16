"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { ShoppingCart, Plus, Minus } from "lucide-react";

export default function AddToCartButton({
  item,
  disabled,
}: {
  item: {
    id: string;
    name: string;
    price: number;
    discount?: number;
    image?: string;
  };
  disabled?: boolean;
}) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  const finalPrice = item.discount && item.discount > 0
    ? item.price - (item.price * item.discount) / 100
    : item.price;

  const handleAdd = () => {
    addItem({
      itemId: item.id,
      name: item.name,
      price: finalPrice,
      quantity,
      image: item.image,
    });
    setQuantity(1);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border rounded-lg">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-2 hover:bg-gray-100"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-10 text-center">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="p-2 hover:bg-gray-100"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={handleAdd}
        disabled={disabled}
        className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="w-5 h-5" />
        Add to Cart
      </button>
    </div>
  );
}
