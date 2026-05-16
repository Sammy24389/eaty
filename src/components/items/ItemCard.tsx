"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";
import { Plus } from "lucide-react";

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount?: number;
    image?: string;
    description?: string;
    isAvailable?: boolean;
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  const { addItem } = useCartStore();
  const finalPrice = item.discount && item.discount > 0
    ? item.price - (item.price * item.discount) / 100
    : item.price;

  const handleAddToCart = () => {
    addItem({
      itemId: item.id,
      name: item.name,
      price: finalPrice,
      quantity: 1,
      image: item.image,
    });
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/items/${item.slug}`} className="block">
        <div className="relative h-48 bg-gray-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
          {item.discount && item.discount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              -{item.discount}%
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/items/${item.slug}`}>
          <h3 className="font-medium truncate hover:text-primary">
            {item.name}
          </h3>
        </Link>

        {item.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-primary">
              ${finalPrice.toFixed(2)}
            </span>
            {item.discount && item.discount > 0 && (
              <span className="text-sm text-gray-400 line-through">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={item.isAvailable === false}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
