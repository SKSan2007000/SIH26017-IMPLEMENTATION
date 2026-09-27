import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LandGuard AI — National Infrastructure Intelligence Command Center',
  description: 'SIH26017 — Predictive Analytics System for Early Detection of Land Acquisition Delays. Demo/simulation prototype.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

