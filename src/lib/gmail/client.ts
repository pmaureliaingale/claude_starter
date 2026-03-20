import { google } from "googleapis";
import { setTokenExpired } from "./tokenStatus";

export function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  // Detect token expiry on refresh
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.access_token) {
      setTokenExpired(false);
    }
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export function isGmailConfigured(): boolean {
  return !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  );
}
