import { NextRequest, NextResponse } from "next/server";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { requireAuth, requireRole } from "@/lib/auth/rbac";

type PrismaModel = {
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
  findFirst: (args?: Record<string, unknown>) => Promise<unknown | null>;
  count: (args?: Record<string, unknown>) => Promise<number>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  upsert: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
};

interface CrudOptions {
  model: PrismaModel;
  adminOnly?: boolean;
  allowedRoles?: string[];
  include?: Record<string, boolean>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, "asc" | "desc">;
  searchFields?: string[];
}

export function createCrudHandler(options: CrudOptions) {
  const { model, adminOnly = false, allowedRoles, include, orderBy } = options;

  return {
    async GET(req: NextRequest, context: { params: Promise<Record<string, string>> }) {
      const key = getRateLimitKey(req, req.nextUrl.pathname);
      const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
      if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

      if (adminOnly) {
        const authResult = await requireAuth();
        if ("error" in authResult && authResult.error) return authResult.error;
      }

      if (allowedRoles) {
        const authResult = await requireRole(allowedRoles);
        if ("error" in authResult && authResult.error) return authResult.error;
      }

      const params = await context.params;
      const { searchParams } = req.nextUrl;
      const idParam = params.id ?? searchParams.get("id");
      const id = idParam ? BigInt(idParam) : null;

      if (id) {
        const item = await model.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ data: item });
      }

      const page = parseInt(searchParams.get("page") || "1");
      const limit2 = parseInt(searchParams.get("limit") || "20");
      const search = searchParams.get("search") || "";
      const status = searchParams.get("status");

      const where: Record<string, unknown> = {};
      if (search && options.searchFields) {
        where.OR = options.searchFields.map((field) => ({
          [field]: { contains: search, mode: "insensitive" },
        }));
      }
      if (status) where.status = parseInt(status);

      const [data, total] = await Promise.all([
        model.findMany({ where, skip: (page - 1) * limit2, take: limit2, ...(include && { include }), ...(orderBy && { orderBy }) }),
        model.count({ where }),
      ]);

      return NextResponse.json({ data, pagination: { page, limit: limit2, total, totalPages: Math.ceil(total / limit2) } });
    },

    async POST(req: NextRequest) {
      const key = getRateLimitKey(req, req.nextUrl.pathname);
      const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
      if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

      if (adminOnly) {
        const authResult = await requireAuth();
        if ("error" in authResult && authResult.error) return authResult.error;
      }

      if (allowedRoles) {
        const authResult = await requireRole(allowedRoles);
        if ("error" in authResult && authResult.error) return authResult.error;
      }

      const body = await req.json();
      const item = await model.create({ data: body, ...(include && { include }) });
      return NextResponse.json({ data: item }, { status: 201 });
    },
  };
}
