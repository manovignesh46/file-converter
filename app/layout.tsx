import './globals.css'

// Use system fonts as a more reliable alternative
const systemFont = {
  className: 'font-system'
}

export const metadata = {
  title: 'File Converter - Professional Image Processing Platform',
  description: 'Convert, compress, resize, and process images with our powerful online tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={systemFont.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
      </body>
    </html>
  )
}
