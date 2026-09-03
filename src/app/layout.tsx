import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedIQ — Healthcare Institutional RoI Dashboard',
  description: 'Primary investor-facing healthcare institutional ROI analytics dashboard connected directly to Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
