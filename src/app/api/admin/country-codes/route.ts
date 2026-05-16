import { NextRequest, NextResponse } from "next/server";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";

  const countries = [
    { name: "United States", code: "US", dialCode: "+1" },
    { name: "United Kingdom", code: "GB", dialCode: "+44" },
    { name: "Canada", code: "CA", dialCode: "+1" },
    { name: "Australia", code: "AU", dialCode: "+61" },
    { name: "India", code: "IN", dialCode: "+91" },
    { name: "Nigeria", code: "NG", dialCode: "+234" },
    { name: "Kenya", code: "KE", dialCode: "+254" },
    { name: "Ghana", code: "GH", dialCode: "+233" },
    { name: "South Africa", code: "ZA", dialCode: "+27" },
    { name: "Germany", code: "DE", dialCode: "+49" },
    { name: "France", code: "FR", dialCode: "+33" },
    { name: "Brazil", code: "BR", dialCode: "+55" },
    { name: "Bangladesh", code: "BD", dialCode: "+880" },
    { name: "Pakistan", code: "PK", dialCode: "+92" },
    { name: "Philippines", code: "PH", dialCode: "+63" },
  ];

  const filtered = search
    ? countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search))
    : countries;

  return NextResponse.json({ data: filtered });
}
