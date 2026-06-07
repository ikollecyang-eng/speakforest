import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpeakForest · 英语森友镇',
  description: '在对话中成长，让英语成为你的力量',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
