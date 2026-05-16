import Image from "next/image";
import Link from "next/link";
import ItemCard from "@/components/items/ItemCard";

async function getSliders() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/sliders`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/item-categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getFeaturedItems() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/items?featured=1&limit=8`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getOffers() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/offers`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [sliders, categories, items, offers] = await Promise.all([
    getSliders(),
    getCategories(),
    getFeaturedItems(),
    getOffers(),
  ]);

  return (
    <div className="bg-gray-50">
      {sliders.length > 0 && (
        <section className="relative h-64 md:h-96 bg-gray-900 overflow-hidden">
          <div className="absolute inset-0">
            {sliders[0].image ? (
              <Image
                src={sliders[0].image}
                alt={sliders[0].title || "Featured"}
                fill
                className="object-cover opacity-60"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/80 to-primary/40" />
            )}
          </div>
          <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-bold">
                {sliders[0].title || "Delicious Food, Delivered Fast"}
              </h1>
              {sliders[0].description && (
                <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-2xl">
                  {sliders[0].description}
                </p>
              )}
              <Link
                href="/items"
                className="mt-6 inline-block bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Order Now
              </Link>
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Categories</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat: { id: string; name: string; slug: string; image?: string }) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="relative w-16 h-16 mb-2 rounded-full overflow-hidden bg-gray-100">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20" />
                  )}
                </div>
                <span className="text-sm font-medium text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Special Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.slice(0, 3).map((offer: { id: string; title: string; description?: string; discount: number; code?: string }) => (
              <div
                key={offer.id}
                className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border p-6"
              >
                <h3 className="text-lg font-bold">{offer.title}</h3>
                {offer.description && (
                  <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {offer.discount}% OFF
                  </span>
                  {offer.code && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                      {offer.code}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Popular Items</h2>
            <Link href="/items" className="text-primary font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item: { id: string; name: string; slug: string; price: number; discount: number; image?: string; description?: string; isAvailable: boolean }) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {!sliders.length && !categories.length && !items.length && (
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold">Welcome to FoodAppi</h2>
          <p className="text-gray-500 mt-2">
            Items will appear here once you add them in the admin panel.
          </p>
          <Link
            href="/admin/login"
            className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-lg"
          >
            Go to Admin
          </Link>
        </section>
      )}
    </div>
  );
}
