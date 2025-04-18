import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "../globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackgroundAnimation from "@/components/ui/BackgroundAnimation";
import { IconDashboard, IconMap, IconChartBar, IconCalendarEvent, IconTimeline } from "@tabler/icons-react";

// Define fonts
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Álomváros - 3D Városi Szimuláció",
  description: "Városi szimuláció 3D vizualizációval és valós idejű adatokkal",
  keywords: ["városfejlesztés", "3D szimuláció", "várostervezés", "statisztikák", "városi projektek"],
  authors: [{ name: "ME Verseny" }],
  icons: {
    icon: [
      { url: '/favico/favicon.ico' },
      { url: '/favico/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favico/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favico/apple-touch-icon.png', sizes: '180x180' }
    ],
  },
  openGraph: {
    title: "Álomváros - 3D Városi Szimuláció",
    description: "Városi szimuláció 3D vizualizációval és valós idejű adatokkal",
    type: "website",
  },
};

// Update the main navigation links to include the events page
const mainNavItems = [
  {
    title: 'Áttekintés',
    href: '/',
    icon: <IconDashboard size={20} />
  },
  {
    title: 'Térképnézet',
    href: '/terkep',
    icon: <IconMap size={20} />
  },
  {
    title: 'Statisztikák',
    href: '/statisztikak',
    icon: <IconChartBar size={20} />
  },
  {
    title: 'Események',
    href: '/esemenyek',
    icon: <IconCalendarEvent size={20} />
  },
  {
    title: 'Időgép',
    href: '/idogep',
    icon: <IconTimeline size={20} />
  },
  // ... any other existing items ...
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>
        <Providers>
          <BackgroundAnimation />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
} 