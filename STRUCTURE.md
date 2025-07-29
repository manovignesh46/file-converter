# File Converter - Project Structure

```
file-converter/
├── 📁 app/                          # Next.js 13+ App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 process/              # Main image processing endpoint
│   │   │   └── route.ts             # Handles all conversion operations
│   │   ├── 📁 download/[filename]/  # Individual file downloads
│   │   │   └── route.ts             # Secure file serving
│   │   ├── 📁 download-all/         # Batch ZIP downloads
│   │   │   └── route.ts             # Creates and serves ZIP files
│   │   ├── 📁 preview/[filename]/   # File previews
│   │   │   └── route.ts             # Serves files for preview
│   │   └── 📁 estimate/             # Size estimation
│   │       └── route.ts             # Real-time size predictions
│   ├── 📄 globals.css               # Global styles with Tailwind
│   ├── 📄 layout.tsx                # Root layout component
│   └── 📄 page.tsx                  # Main application page
│
├── 📁 components/                   # React Components
│   ├── 📄 DragDropUploader.tsx     # 🎯 Core upload component
│   │                                #   - Drag & drop functionality
│   │                                #   - File preview with thumbnails
│   │                                #   - Real-time size estimation
│   │                                #   - Sortable image reordering
│   ├── 📄 PreviewCard.tsx          # Individual image preview cards
│   │                                #   - Shows original vs estimated size
│   │                                #   - Compression ratio display
│   │                                #   - Remove/reorder controls
│   ├── 📄 OptionsPanel.tsx         # 🛠️ Processing configuration
│   │                                #   - Operation type selection
│   │                                #   - Quality/size controls
│   │                                #   - Format conversion options
│   │                                #   - Advanced settings
│   ├── 📄 ProgressModal.tsx        # Processing progress tracker
│   │                                #   - Real-time progress updates
│   │                                #   - Step-by-step status
│   │                                #   - Error handling display
│   ├── 📄 ResultsView.tsx          # 📥 Results and downloads
│   │                                #   - Processed file previews
│   │                                #   - Individual/batch downloads
│   │                                #   - Processing statistics
│   └── 📄 Header.tsx               # Application header/navigation
│
├── 📁 services/                     # 🔧 Business Logic Services
│   ├── 📄 imageCompressionService.ts # Image compression logic
│   │                                 #   - Quality-based compression
│   │                                 #   - Target size compression
│   │                                 #   - Format optimization
│   ├── 📄 imageResizeService.ts      # Image resizing logic
│   │                                 #   - Dimension-based resizing
│   │                                 #   - Aspect ratio preservation
│   │                                 #   - Crop/fit options
│   ├── 📄 imageToPdfService.ts       # PDF generation service
│   │                                 #   - Multi-image PDF creation
│   │                                 #   - Page layout options
│   │                                 #   - Size optimization
│   └── 📄 formatConversionService.ts # Format conversion & watermark
│                                     #   - JPG/PNG/WebP conversion
│                                     #   - Watermark application
│                                     #   - Metadata handling
│
├── 📁 lib/                          # Utility Libraries
│   ├── 📄 mongodb.ts               # Database connection
│   └── 📄 models.ts                # Data models (Job, FileHistory)
│
├── 📁 public/                      # Static Assets
│   └── 📁 processed/               # Processed files storage
│       └── (generated files)       # Dynamically created files
│
├── 📄 package.json                 # Dependencies & scripts
├── 📄 tailwind.config.js          # Tailwind CSS configuration
├── 📄 next.config.js              # Next.js configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 .env.local                  # Environment variables
├── 📄 .gitignore                  # Git ignore rules
├── 📄 demo.sh                     # Demo script
├── 📄 README.md                   # Documentation
└── 📄 STRUCTURE.md               # This file
```

## 🎯 Key Features Implementation

### Real-time Image Preview & Estimation
- **DragDropUploader**: Handles file selection and provides instant thumbnails
- **PreviewCard**: Shows original size, estimated processed size, and compression ratio
- **Size Estimation API**: Calculates expected results before processing

### Drag & Drop with Reordering
- **@dnd-kit/core**: Modern drag-and-drop implementation
- **Sortable Interface**: Users can reorder images before PDF conversion
- **Visual Feedback**: Clear drag handles and drop zones

### Modular Processing Services
- **Compression**: Quality-based and target-size compression
- **Resize**: Dimension control with aspect ratio options
- **PDF**: Multi-image PDF generation with layout control
- **Format Conversion**: Seamless format switching
- **Watermarking**: Text watermark application

### Progress Tracking & User Experience
- **Real-time Progress**: WebSocket-like updates during processing
- **Error Handling**: Graceful error display and recovery
- **Batch Downloads**: ZIP file generation for multiple results

## 🚀 Usage Flow

1. **Upload**: Drag & drop or select image files
2. **Preview**: View thumbnails with size estimates
3. **Configure**: Choose processing options and settings
4. **Reorder**: Drag images to desired order (for PDF)
5. **Process**: Start conversion with real-time progress
6. **Download**: Get individual files or ZIP archive

## 🛠️ Technical Highlights

- **Sharp**: High-performance image processing
- **pdf-lib**: Professional PDF generation
- **Tailwind CSS**: Responsive, modern UI design
- **MongoDB**: Optional job tracking and history
- **TypeScript**: Type-safe development
- **Next.js 14**: Modern React framework with App Router
