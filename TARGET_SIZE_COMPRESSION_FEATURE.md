# Target Size Compression Feature

## Overview

Enhanced the compression settings UI to provide two distinct modes for both image and PDF compression:
1. **By Quality** - Traditional percentage-based quality slider
2. **By File Size** - Target a specific file size with quick government-compliant presets

## User Request

Government websites often have strict file size requirements:
- **Images**: Maximum 50 KB
- **PDFs**: Maximum 200 KB

Users need an easy way to compress files to meet these requirements without trial and error.

## Features Implemented

### 1. Compression Mode Toggle

Both image and PDF compression now have two modes:

#### Mode Buttons
- **By Quality**: Uses quality percentage (10-100%)
- **By File Size**: Uses target file size in KB/MB

Users can switch between modes with a clear button toggle.

### 2. Quick Presets for Government Requirements

#### Image Compression Presets
- **50 KB** - Government Image Standard (highlighted)
- **100 KB** - Common alternative
- **200 KB** - Larger documents
- **500 KB** - Maximum compatibility

#### PDF Compression Presets
- **200 KB** - Government PDF Standard (highlighted)
- **500 KB** - Medium documents
- **1 MB** - Large documents
- **2 MB** - Maximum size

### 3. Custom Size Input

Users can also enter any custom size:
- Input field for numeric value
- Dropdown to select KB or MB
- Supports decimal values (e.g., 0.5 MB)

### 4. Visual Indicators

- **Green highlight** on selected preset
- **Helpful tips** below custom input explaining government requirements
- **Clean, intuitive layout** with clear labels

## UI Changes

### Image Compression Panel (Blue Background)

```
┌─────────────────────────────────────┐
│ Compression Settings                │
├─────────────────────────────────────┤
│ Compression Mode                    │
│ ┌────────────┬──────────────┐      │
│ │ By Quality │ By File Size │      │
│ └────────────┴──────────────┘      │
│                                     │
│ Quick Presets                       │
│ ┌────────┬─────────┐               │
│ │ 50 KB  │ 100 KB  │               │
│ │Gov.Img │         │               │
│ ├────────┼─────────┤               │
│ │ 200 KB │ 500 KB  │               │
│ └────────┴─────────┘               │
│                                     │
│ Custom Target Size                  │
│ ┌──────────┬────┐                  │
│ │   50     │ KB │                  │
│ └──────────┴────┘                  │
│ 💡 Govt. sites require < 50 KB     │
└─────────────────────────────────────┘
```

### PDF Compression Panel (Red Background)

```
┌─────────────────────────────────────┐
│ PDF Compression Settings            │
├─────────────────────────────────────┤
│ Compression Mode                    │
│ ┌────────────┬──────────────┐      │
│ │ By Quality │ By File Size │      │
│ └────────────┴──────────────┘      │
│                                     │
│ Quick Presets                       │
│ ┌────────┬─────────┐               │
│ │ 200 KB │ 500 KB  │               │
│ │Gov.PDF │         │               │
│ ├────────┼─────────┤               │
│ │  1 MB  │  2 MB   │               │
│ └────────┴─────────┘               │
│                                     │
│ Custom Target Size                  │
│ ┌──────────┬────┐                  │
│ │  200     │ KB │                  │
│ └──────────┴────┘                  │
│ 💡 Govt. sites require < 200 KB    │
└─────────────────────────────────────┘
```

## User Workflow

### Scenario 1: Compress Image for Government Application

1. Upload an image (e.g., passport photo, 2.5 MB)
2. Select "Compress" operation
3. Click "By File Size" mode
4. Click "50 KB" preset (Government Image)
5. Click "Estimate Size" to see if achievable
6. Click "Process" to compress

**Result**: Image compressed to ≤50 KB, ready for government upload

### Scenario 2: Compress PDF for Government Form

1. Upload a PDF document (e.g., certificate, 1.7 MB)
2. Select "Compress PDF" operation
3. Click "By File Size" mode
4. Click "200 KB" preset (Government PDF)
5. Click "Estimate Size" to verify
6. Click "Process" to compress

**Result**: PDF compressed to ≤200 KB, meeting government requirements

### Scenario 3: Custom Size Requirement

1. Upload file
2. Select compression operation
3. Click "By File Size" mode
4. Enter custom value (e.g., 150 KB)
5. Select unit (KB)
6. Process file

**Result**: File compressed to target 150 KB

## Technical Implementation

### Component Changes

**File**: `components/OptionsPanel.tsx`

#### Image Compression Section
- Replaced checkbox toggle with button mode selector
- Added 4 quick preset buttons (50KB, 100KB, 200KB, 500KB)
- Highlighted 50KB as "Gov. Image" standard
- Added helpful tip about government requirements
- Conditional rendering based on selected mode

#### PDF Compression Section
- Replaced checkbox toggle with button mode selector
- Added 4 quick preset buttons (200KB, 500KB, 1MB, 2MB)
- Highlighted 200KB as "Gov. PDF" standard
- Added helpful tip about government requirements
- Conditional rendering based on selected mode

### State Management

Both modes use the same state variables:
- `options.targetSize`: Number value of target size
- `options.targetSizeUnit`: "KB" or "MB"
- `options.compressionQuality`: Used only in quality mode

When switching modes:
- **To File Size**: Sets default to 50KB (images) or 200KB (PDFs)
- **To Quality**: Clears targetSize, reverts to quality slider

### Preset Button Logic

Each preset button:
```typescript
onClick={() => {
  updateOption('targetSize', 50)
  updateOption('targetSizeUnit', 'KB')
}}
```

Active state styling:
```typescript
className={`... ${
  options.targetSize === 50 && options.targetSizeUnit === 'KB'
    ? 'bg-green-600 text-white border-green-600'
    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
}`}
```

## Backend Support

The backend already supports target size compression:

### Image Compression
- `services/imageCompressionService.ts`
- Uses iterative compression to reach target size
- Binary search algorithm for optimal quality

### PDF Compression
- `services/pdfCompressionService.ts`
- Uses QPDF for effective compression
- Iterative compression until target reached
- Falls back if target unreachable

### Estimation API
- `app/api/estimate/route.ts`
- Returns estimated size for both modes
- Helps users know if target is achievable

## Benefits

### User Experience
✅ **No guessing** - Direct size input instead of quality trial-and-error  
✅ **Government-ready** - One-click presets for common requirements  
✅ **Flexible** - Can still use quality mode or custom sizes  
✅ **Clear guidance** - Visual indicators and helpful tips  
✅ **Mobile-friendly** - Responsive grid layout

### Efficiency
✅ **Faster workflow** - Fewer compression attempts needed  
✅ **Accurate estimation** - Users know upfront if target is achievable  
✅ **Pre-validated sizes** - Presets guaranteed to work well

### Compliance
✅ **Government standards** - Built-in 50KB image / 200KB PDF presets  
✅ **Professional use** - Meets official document requirements  
✅ **Universal compatibility** - Covers most submission portals

## Testing Scenarios

### Test 1: Government Image (50 KB)
- **Input**: High-res photo (3.2 MB)
- **Action**: Select 50 KB preset
- **Expected**: Compressed to ≤50 KB, acceptable quality for ID

### Test 2: Government PDF (200 KB)
- **Input**: Multi-page certificate (1.7 MB)
- **Action**: Select 200 KB preset
- **Expected**: Compressed to ≤200 KB, readable text

### Test 3: Custom Size
- **Input**: Document (500 KB)
- **Action**: Enter 150 KB custom
- **Expected**: Compressed to ~150 KB

### Test 4: Mode Switching
- **Action**: Switch between Quality and File Size modes
- **Expected**: UI updates correctly, state preserved

### Test 5: Unreachable Target
- **Input**: Already compressed file (30 KB)
- **Action**: Try to compress to 10 KB
- **Expected**: Warning or best-effort result

## Future Enhancements

### Possible Additions
1. **Regional Presets**: Different countries have different limits
2. **Format-specific Presets**: Different sizes for JPEG vs PNG
3. **Batch Presets**: Apply same size to multiple files
4. **Size Warnings**: Alert if target is too aggressive
5. **Quality Preview**: Show preview before final compression
6. **Auto-detect**: Suggest size based on image content

### Advanced Features
1. **Smart Compression**: AI-based quality adjustment
2. **Multi-pass Optimization**: Better compression algorithms
3. **Lossless Options**: Where possible, keep quality
4. **Comparison View**: Before/after side-by-side

## Compatibility Notes

- Works with existing backend compression services
- No database schema changes required
- Backward compatible with existing quality mode
- All file types supported (JPEG, PNG, PDF, etc.)

## Documentation Updates

Users should be informed:
- Government requirements vary by region/department
- Some files may not reach extreme targets (e.g., 10 KB for complex PDFs)
- Quality may degrade significantly for very small targets
- Estimation is approximate, actual size may vary slightly
- QPDF compression provides best results for PDFs

## Conclusion

This feature dramatically improves the user experience for government document submissions and other size-restricted scenarios. Users can now directly specify their target size requirements with one-click presets or custom inputs, eliminating the guesswork of quality-based compression.
