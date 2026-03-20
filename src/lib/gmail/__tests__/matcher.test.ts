import { matchFollowUpToApplication } from "../matcher";
import type { ParsedFollowUp } from "../parsers";

// Manual Prisma mock
const mockPrisma = {
  job_application: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

const baseFollowUp: ParsedFollowUp = {
  company: "Acme Corp",
  emailSubject: "Thank you for applying to Acme Corp",
  emailBody: "We received your application.",
  receivedAt: new Date("2026-03-01"),
  senderDomain: "acmecorp.com",
  threadId: "thread123",
  gmailMessageId: "msg456",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("matchFollowUpToApplication", () => {
  it("matches by Gmail thread ID first", async () => {
    mockPrisma.job_application.findFirst.mockResolvedValue({ id: "app-by-thread" });

    const result = await matchFollowUpToApplication(baseFollowUp, mockPrisma as any);

    expect(result).toBe("app-by-thread");
    expect(mockPrisma.job_application.findFirst).toHaveBeenCalledWith({
      where: { gmail_thread_id: "thread123" },
    });
  });

  it("falls back to company name match when no thread match", async () => {
    mockPrisma.job_application.findFirst.mockResolvedValue(null);
    mockPrisma.job_application.findMany.mockResolvedValue([
      { id: "app-by-company", company: "Acme Corp" },
      { id: "other-app", company: "Beta Inc" },
    ]);

    const result = await matchFollowUpToApplication(
      { ...baseFollowUp, threadId: "" },
      mockPrisma as any
    );

    expect(result).toBe("app-by-company");
  });

  it("falls back to domain match when no company match", async () => {
    mockPrisma.job_application.findFirst.mockResolvedValue(null);
    mockPrisma.job_application.findMany.mockResolvedValue([
      { id: "domain-match", company: "Acme Corporation" },
    ]);

    const result = await matchFollowUpToApplication(
      { ...baseFollowUp, company: "NoMatch", threadId: "" },
      mockPrisma as any
    );

    // domain "acmecorp" should partially match "acmecorporation"
    expect(typeof result).toBe("string");
  });

  it("creates a manual_review application when no match found", async () => {
    mockPrisma.job_application.findFirst.mockResolvedValue(null);
    mockPrisma.job_application.findMany.mockResolvedValue([]);
    mockPrisma.job_application.create.mockResolvedValue({ id: "new-manual-review" });

    const result = await matchFollowUpToApplication(
      { ...baseFollowUp, company: "UnknownCo", threadId: "", senderDomain: "unknownco.xyz" },
      mockPrisma as any
    );

    expect(result).toBe("new-manual-review");
    expect(mockPrisma.job_application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "manual_review" }),
      })
    );
  });
});
