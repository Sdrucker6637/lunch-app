import type { Metadata } from "next";
import { Anton, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { LunchProvider } from "@/lib/lunch-context";
import Shell from "@/components/Shell";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lunch Radius",
  description: "Great lunch. Never more than a 20-minute walk from the office.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${anton.variable} ${spaceGrotesk.variable}`}>
      <body>
        <LunchProvider>
          <Shell>{children}</Shell>
        </LunchProvider>
      </body>
    </html>
  );
}
