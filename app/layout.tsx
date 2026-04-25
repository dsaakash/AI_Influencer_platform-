import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InfluenceIQ — Affiliate Sales & Payment Tracking',
  description: 'Track influencer-driven sales, manage payments, and get AI-powered performance insights for your brand.',
  keywords: 'influencer marketing, affiliate tracking, sales analytics, payment management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased animated-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}
