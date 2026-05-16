import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/items/AddToCartButton";

async function getItem(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/items?slug=${slug}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item) notFound();

  const finalPrice = item.discount && item.discount > 0
    ? item.price - (item.price * item.discount) / 100
    : item.price;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/items" className="hover:text-primary">Menu</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{item.name}</span>
      </nav>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative h-64 md:h-full bg-gray-100">
            {item.image ? (
              <Image src={item.image} alt={item.name} fill className="object-cover" priority />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Image
              </div>
            )}
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-bold">{item.name}</h1>
            {item.description && (
              <p className="text-gray-600 mt-3">{item.description}</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">
                ${finalPrice.toFixed(2)}
              </span>
              {item.discount && item.discount > 0 && (
                <span className="text-lg text-gray-400 line-through">
                  ${item.price.toFixed(2)}
                </span>
              )}
            </div>

            {item.isAvailable === false && (
              <p className="mt-3 text-red-500 font-medium">Currently Unavailable</p>
            )}

            <div className="mt-6">
              <AddToCartButton item={item} disabled={item.isAvailable === false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
