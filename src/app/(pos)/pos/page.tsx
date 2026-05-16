"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface PosItem {
  id: string;
  name: string;
  price: string;
  discount: number;
  image: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
}

interface PosCategory {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  instruction: string;
}

export default function PosPage() {
  const [items, setItems] = useState<PosItem[]>([]);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<Record<string, unknown> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [orderType, setOrderType] = useState("dine-in");

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/frontend/items?limit=100");
      const data = await res.json();
      setItems(data.data || []);
    } catch {
      console.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/item-categories");
      const data = await res.json();
      setCategories(data.data || []);
    } catch {
      console.error("Failed to fetch categories");
    }
  };

  const addToCart = useCallback((item: PosItem) => {
    if (!item.isAvailable) return;
    const price = item.discount > 0
      ? Number(item.price) - (Number(item.price) * item.discount) / 100
      : Number(item.price);

    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { id: item.id, name: item.name, price, quantity: 1, discount: item.discount, instruction: "" }];
    });
  }, []);

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity } : c)));
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const change = cashReceived ? Number(cashReceived) - total : 0;

  const filteredItems = items.filter((item) => {
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/admin/pos-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ itemId: c.id, quantity: c.quantity, price: c.price })),
          customerName,
          paymentMethod,
          orderType,
          subtotal,
          tax,
          total,
          cashReceived: paymentMethod === "cash" ? Number(cashReceived) : total,
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      const data = await res.json();
      setLastOrder(data.data);
      setShowCheckout(false);
      setShowReceipt(true);
      clearCart();
      setCustomerName("");
      setCashReceived("");
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">POS</h1>
          <div className="flex gap-2">
            {["dine-in", "takeaway", "delivery"].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  orderType === type
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.replace("-", " ")}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-48 bg-white border-r overflow-y-auto">
            <button
              onClick={() => setSelectedCategory("")}
              className={`w-full px-4 py-3 text-left text-sm font-medium border-b ${
                !selectedCategory ? "bg-primary text-white" : "hover:bg-gray-50"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full px-4 py-3 text-left text-sm border-b ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No items found</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map((item) => {
                  const price = item.discount > 0
                    ? Number(item.price) - (Number(item.price) * item.discount) / 100
                    : Number(item.price);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      disabled={!item.isAvailable}
                      className={`bg-white rounded-lg border p-3 text-left hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                        !item.isAvailable ? "grayscale" : ""
                      }`}
                    >
                      <div className="relative h-24 bg-gray-100 rounded mb-2 overflow-hidden">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <p className="text-primary font-bold mt-1">${price.toFixed(2)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Current Order</h2>
            <button onClick={clearCart} className="text-sm text-red-500 hover:underline">
              Clear
            </button>
          </div>
          {customerName && (
            <p className="text-sm text-gray-500 mt-1">Customer: {customerName}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg">Empty Cart</p>
              <p className="text-sm mt-1">Tap items to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-2">
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Complete Order</h2>
              <button onClick={() => setShowCheckout(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name (optional)</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "other", label: "Other" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`py-2 rounded-lg text-sm font-medium ${
                        paymentMethod === method.value
                          ? "bg-primary text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
              {paymentMethod === "cash" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cash Received</label>
                  <input type="number" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg" />
                  {change >= 0 && cashReceived && (
                    <p className="mt-1 text-green-600 font-medium">Change: ${change.toFixed(2)}</p>
                  )}
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700"
              >
                Complete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Order Complete!</h2>
              <p className="text-gray-500 mt-1">Order #{(lastOrder as Record<string, string>).orderNumber}</p>
            </div>
            <div className="border-t border-b p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Order Type</span><span className="capitalize">{orderType}</span></div>
                <div className="flex justify-between"><span>Payment</span><span className="capitalize">{paymentMethod}</span></div>
                {customerName && <div className="flex justify-between"><span>Customer</span><span>{customerName}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span><span>${Number((lastOrder as Record<string, string>).total || total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex gap-3">
              <button onClick={() => setShowReceipt(false)} className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90">New Order</button>
              <button onClick={() => window.print()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
