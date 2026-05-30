import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { PosthogProvider } from '@/components/shared/posthog-provider';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: {
    default: 'PlantBridge',
    template: '%s | PlantBridge',
  },
  description:
    'Personalized cannabis wellness education — understand cannabinoids, terpenes, and formats tailored to your wellness goals.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PlantBridge',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2B4536',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <PosthogProvider>{children}</PosthogProvider>
      </body>
    </html>
  );
}
