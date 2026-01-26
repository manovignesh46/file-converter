/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output to avoid trace collection issues
  output: 'standalone',
  
  // Configure external domains if needed
  images: {
    domains: ['fonts.gstatic.com', 'fonts.googleapis.com'],
  },
}

module.exports = nextConfig
