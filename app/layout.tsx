import type { Metadata } from "next";
import { Comfortaa, Satisfy, Vollkorn } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["700"],
});

const satisfy = Satisfy({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: ["400"],
});

const vollkorn = Vollkorn({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Birthday Wishes",
  description: "A special collection of birthday messages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${comfortaa.variable} ${satisfy.variable} ${vollkorn.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
