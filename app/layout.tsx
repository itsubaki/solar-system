import type { Metadata } from 'next'
import './globals.css'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover' as const,
}

export const metadata: Metadata = {
    title: 'Solar System',
    description: 'Interactive 3D Simulator of the Solar System.',
    icons: {
        icon: [
            {
                url: `${basePath}/icon-light-32x32.png`,
                media: '(prefers-color-scheme: light)',
            },
            {
                url: `${basePath}/icon-dark-32x32.png`,
                media: '(prefers-color-scheme: dark)',
            },
            {
                url: `${basePath}/icon.svg`,
                type: 'image/svg+xml',
            },
        ],
        apple: `${basePath}/apple-icon.png`,
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="dark bg-background">
            <body className="font-sans antialiased bg-background">
                {children}
            </body>
        </html>
    )
}
