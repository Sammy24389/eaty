import ItemCard from "@/components/items/ItemCard";
import Link from "next/link";

async function getItems(search?: string, category?: string) {
  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    params.set("limit", "24");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/items?${params}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return { items: [], categories: [] };
    const data = await res.json();
    return data;
  } catch {
    return { items: [], categories: [] };
  }
}

async function getCategories() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/item-categories`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const resolvedParams = await searchParams;
  const [{ items, categories: catsFromItems }, allCategories] = await Promise.all([
    getItems(resolvedParams.search, resolvedParams.category),
    getCategories(),
  ]);

  const categories = catsFromItems?.length ? catsFromItems : allCategories;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Menu</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border p-4 sticky top-20">
            <h2 className="font-semibold mb-4">Categories</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/items"
                  className={`block px-3 py-2 rounded text-sm ${
                    !resolvedParams.category
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  All Items
                </Link>
              </li>
              {categories.map((cat: { id: string; name: string; slug: string }) => (
                <li key={cat.id}>
                  <Link
                    href={`/items?category=${cat.slug}`}
                    className={`block px-3 py-2 rounded text-sm ${
                      resolvedParams.category === cat.slug
                        ? "bg-primary text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex-1">
          <form className="mb-6">
            <input
              type="text"
              name="search"
              placeholder="Search items..."
              defaultValue={resolvedParams.search}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item: { id: string; name: string; slug: string; price: number; discount: number; image?: string; description?: string; isAvailable: boolean }) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No items found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
