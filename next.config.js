/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output to avoid trace collection issues
  output: 'standalone',
  
  // Optimize font loading and reduce external dependencies
  optimizeFonts: true,
  
  // Configure external domains if needed
  images: {
    domains: ['fonts.gstatic.com', 'fonts.googleapis.com'],
  },
}

module.exports = nextConfig
