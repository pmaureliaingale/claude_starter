/**
 * @jest-environment node
 */

// Admin authorization boundary tests
const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/admin/users/route";
import { NextRequest } from "next/server";

function makeRequest(method = "GET", body?: object): NextRequest {
  return new NextRequest("http://localhost/api/admin/users", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : {},
  });
}

describe("GET /api/admin/users", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as viewer", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "1", role: "viewer" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns 200 when authenticated as admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "1", role: "admin" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/users", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(
      makeRequest("POST", { username: "test", email: "t@t.com", password: "pass" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as viewer", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "1", role: "viewer" } });
    const res = await POST(
      makeRequest("POST", { username: "test", email: "t@t.com", password: "pass" })
    );
    expect(res.status).toBe(403);
  });
});
