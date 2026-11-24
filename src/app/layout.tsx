import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urban Air Quality Assistant",
  description: "Personalised smog-safe routines, indoor air tips and sustainable alternatives for your family.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
