#!/bin/bash

# File Converter Demo Script
echo "🚀 File Converter Platform Demo"
echo "================================"
echo ""

# Check if server is running
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Server is running on http://localhost:3001"
else
    echo "❌ Server is not running. Please start with 'npm run dev'"
    exit 1
fi

echo ""
echo "📋 Available Features:"
echo "1. 🗜️  Image Compression - Reduce file size with quality control"
echo "2. 📏 Image Resizing - Change dimensions with aspect ratio options"
echo "3. 🔄 Format Conversion - Convert between JPG, PNG, WebP"
echo "4. 📄 PDF Generation - Combine images into PDF documents"
echo "5. 🏷️  Watermarking - Add text watermarks to images"
echo ""

echo "🌐 Access the application:"
echo "   Local:     http://localhost:3001"
echo "   Network:   http://$(hostname -I | cut -d' ' -f1):3001"
echo ""

echo "📁 Test Images:"
echo "   You can test with any image files (JPG, PNG, WebP, GIF, BMP)"
echo "   Maximum file size: 50MB per file"
echo ""

echo "🛠️  API Endpoints:"
echo "   POST /api/process - Process uploaded images"
echo "   GET  /api/download/[filename] - Download processed files"
echo "   GET  /api/download-all - Download ZIP of all files"
echo "   POST /api/estimate - Estimate processing results"
echo ""

echo "💡 Demo Workflow:"
echo "   1. Open http://localhost:3001 in your browser"
echo "   2. Drag & drop images or click to upload"
echo "   3. Choose processing options (compress, resize, etc.)"
echo "   4. Preview estimated results"
echo "   5. Process images and download results"
echo ""

echo "🔧 Technical Stack:"
echo "   Frontend: Next.js 14, React 18, Tailwind CSS"
echo "   Backend:  Next.js API Routes, Sharp, pdf-lib"
echo "   Database: MongoDB (optional for job tracking)"
echo ""

echo "📊 Processing Capabilities:"
echo "   • Real-time compression estimation"
echo "   • Batch processing multiple images"
echo "   • Drag & drop with file reordering"
echo "   • Progress tracking with live updates"
echo "   • ZIP download for multiple files"
echo ""

echo "Ready to test! 🎉"
