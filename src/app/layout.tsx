import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Modern geometric, subtly rounded typeface used across the app.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PASA Election System · OYSCATECH",
  description:
    "Secure electronic ballot for the Public Administration Students' Association Executive Election — Oyo State College of Agriculture and Technology, Igbo-Ora.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", jakarta.variable)}>
      <body>{children}</body>
    </html>
  );
}
