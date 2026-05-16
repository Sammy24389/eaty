async function getOffers() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frontend/offers`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Special Offers</h1>

      {offers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No active offers at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer: { id: string; title: string; description?: string; discount: number; code?: string; startDate: string; endDate: string }) => (
            <div
              key={offer.id}
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border p-6"
            >
              <h2 className="text-xl font-bold">{offer.title}</h2>
              {offer.description && (
                <p className="text-gray-600 mt-2">{offer.description}</p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  {offer.discount}% OFF
                </span>
                {offer.code && (
                  <span className="bg-primary text-white text-sm px-3 py-1 rounded font-mono">
                    {offer.code}
                  </span>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Valid: {new Date(offer.startDate).toLocaleDateString()} -{" "}
                {new Date(offer.endDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
