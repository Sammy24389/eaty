"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const ref = searchParams.get("reference") || searchParams.get("tx_ref");
    const oid = searchParams.get("orderId");
    const trx = searchParams.get("trxref");

    if (!oid) {
      setStatus("failed");
      setMessage("No order ID found");
      return;
    }

    setOrderId(oid);
    verifyPayment(ref || trx, oid);
  }, [searchParams]);

  const verifyPayment = async (reference: string | null, orderId: string) => {
    try {
      const res = await fetch(`/api/payment/verify?reference=${reference}&orderId=${orderId}`);
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage("Payment successful! Your order has been confirmed.");
      } else {
        setStatus("failed");
        setMessage(data.error || "Payment verification failed");
      }
    } catch {
      setStatus("failed");
      setMessage("Failed to verify payment. Please contact support.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold mt-4">Verifying Payment...</h2>
            <p className="text-gray-500 mt-2">Please wait while we confirm your payment</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold mt-4 text-green-600">Payment Successful!</h2>
            <p className="text-gray-500 mt-2">{message}</p>
            <div className="mt-6 space-y-3">
              <Link
                href={`/orders/${orderId}`}
                className="block w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90"
              >
                View Order
              </Link>
              <Link
                href="/items"
                className="block w-full text-primary py-2 text-sm hover:underline"
              >
                Order More Food
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold mt-4 text-red-600">Payment Failed</h2>
            <p className="text-gray-500 mt-2">{message}</p>
            <div className="mt-6 space-y-3">
              <Link
                href="/checkout"
                className="block w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90"
              >
                Try Again
              </Link>
              <Link
                href="/contact"
                className="block w-full text-primary py-2 text-sm hover:underline"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
