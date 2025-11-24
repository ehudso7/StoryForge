import type { Metadata } from "next"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "StoryForge - AI-Powered Writing Platform",
    template: "%s | StoryForge",
  },
  description:
    "Elevate your storytelling with StoryForge's AI-powered writing tools, real-time quality metrics, and the revolutionary UWQES scoring system.",
  keywords: [
    "writing",
    "storytelling",
    "AI writing",
    "writing quality",
    "UWQES",
    "novel writing",
    "creative writing",
    "writing metrics",
  ],
  authors: [{ name: "StoryForge Team" }],
  creator: "StoryForge",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://storyforge.com",
    title: "StoryForge - AI-Powered Writing Platform",
    description:
      "Elevate your storytelling with AI-powered writing tools and quality metrics.",
    siteName: "StoryForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoryForge - AI-Powered Writing Platform",
    description:
      "Elevate your storytelling with AI-powered writing tools and quality metrics.",
    creator: "@storyforge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${merriweather.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
