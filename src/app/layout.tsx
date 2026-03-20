import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Helper — Job Search Tracker",
  description: "Track your job applications across all platforms in one place",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(15, 10, 40, 0.95)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                color: "#e2e8f0",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
