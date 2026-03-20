import { parseApplicationEmail, parseFollowUpEmail } from "../parsers";
import type { gmail_v1 } from "googleapis";

function makeMessage(overrides: {
  id?: string;
  threadId?: string;
  subject?: string;
  from?: string;
  date?: string;
  body?: string;
}): gmail_v1.Schema$Message {
  const headers: gmail_v1.Schema$MessagePartHeader[] = [
    { name: "Subject", value: overrides.subject ?? "" },
    { name: "From", value: overrides.from ?? "noreply@linkedin.com" },
    { name: "Date", value: overrides.date ?? "Mon, 19 Mar 2026 10:00:00 +0000" },
  ];

  const bodyData = overrides.body
    ? Buffer.from(overrides.body).toString("base64")
    : "";

  return {
    id: overrides.id ?? "msg123",
    threadId: overrides.threadId ?? "thread123",
    payload: {
      headers,
      body: { data: bodyData },
    },
  };
}

describe("parseApplicationEmail", () => {
  it("parses a LinkedIn application email correctly", () => {
    const message = makeMessage({
      subject: "Pablo, your application was sent to Acme Corp",
      body: "Congratulations! You applied for the position of Software Engineer at Acme Corp.",
    });

    const result = parseApplicationEmail(message);

    expect(result).not.toBeNull();
    expect(result?.company).toBe("Acme Corp");
    expect(result?.source).toBe("linkedin");
    expect(result?.gmailMessageId).toBe("msg123");
    expect(result?.threadId).toBe("thread123");
  });

  it("returns null when subject does not match", () => {
    const message = makeMessage({
      subject: "Thank you for your interest",
    });

    expect(parseApplicationEmail(message)).toBeNull();
  });

  it("returns null for an empty subject", () => {
    const message = makeMessage({ subject: "" });
    expect(parseApplicationEmail(message)).toBeNull();
  });

  it("sets dateApplied from the Date header", () => {
    const message = makeMessage({
      subject: "Pablo, your application was sent to Beta Inc",
      date: "Tue, 15 Jan 2026 14:30:00 +0000",
    });

    const result = parseApplicationEmail(message);
    expect(result?.dateApplied).toBeInstanceOf(Date);
    expect(result?.dateApplied.getFullYear()).toBe(2026);
  });
});

describe("parseFollowUpEmail", () => {
  it("parses a follow-up email correctly", () => {
    const message = makeMessage({
      subject: "Thank you for applying to Acme Corp",
      from: "no-reply@acmecorp.com",
      body: "We received your application and will be in touch.",
    });

    const result = parseFollowUpEmail(message);

    expect(result).not.toBeNull();
    expect(result?.company).toBe("Acme Corp");
    expect(result?.emailSubject).toBe("Thank you for applying to Acme Corp");
    expect(result?.senderDomain).toBe("acmecorp.com");
    expect(result?.gmailMessageId).toBe("msg123");
  });

  it("returns null when sender is not no-reply", () => {
    const message = makeMessage({
      subject: "Thank you for applying to Acme Corp",
      from: "recruiter@acmecorp.com",
    });

    expect(parseFollowUpEmail(message)).toBeNull();
  });

  it("returns null when subject does not match", () => {
    const message = makeMessage({
      subject: "Pablo, your application was sent to Acme Corp",
      from: "no-reply@acmecorp.com",
    });

    expect(parseFollowUpEmail(message)).toBeNull();
  });

  it("stores full email body", () => {
    const bodyText = "We appreciate your interest in joining our team.";
    const message = makeMessage({
      subject: "Thank you for applying to Beta Inc",
      from: "noreply@betainc.com",
      body: bodyText,
    });

    const result = parseFollowUpEmail(message);
    expect(result?.emailBody).toBe(bodyText);
  });
});
