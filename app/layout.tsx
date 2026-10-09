import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Management Portal | Let's Fly.lk",
  description: "Internal travel management portal for Let's Fly.lk.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="m-0 min-h-full">{children}</body>
    </html>
  );
}
