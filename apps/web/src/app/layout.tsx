import { Inter } from "next/font/google"

import type { Metadata } from "next"

import { EVENT } from "@/lib/config"
import { Footer } from "@/components/ui/footer"
import { Navbar } from "@/components/ui/navbar"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: `${EVENT.name} · ${EVENT.subtitle}`,
    template: `%s · ${EVENT.name}`,
  },
  description: EVENT.tagline,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
