# Side-by-Side PDF Layout Feature

## Overview
Added a new feature that allows users to place two images side-by-side on a single PDF page. This is perfect for creating ID card PDFs where you want the front and back on the same page.

## What's New

### Before
When converting images to PDF:
- Each image was placed on a separate page
- PAN card front → Page 1
- PAN card back → Page 2

### After ✅
Users can now choose:
- **Option 1:** One image per page (default, same as before)
- **Option 2:** Two images side-by-side (2-up layout) ⭐ NEW!

## How It Works

### User Flow

1. **Upload your images** (e.g., PAN card front and back)
2. **Select "Convert" operation**
3. **Choose "PDF" as output format**
4. **Select "Images Per Page":**
   - `One image per page` - Traditional layout
   - `Two images side-by-side (2-up)` - NEW layout for ID cards
5. **Click "Process Files"**
6. **Download your PDF** with images arranged as selected

### Example Use Cases

#### ID Cards / Documents
```
Upload: pan_front.jpg, pan_back.jpg
Select: Two images side-by-side
Result: One PDF page with:
┌─────────────────────────────────┐
│  [Front]    │    [Back]         │
│   Image     │     Image         │
│             │                   │
└─────────────────────────────────┘
```

#### Receipts / Forms
```
Upload: receipt1.jpg, receipt2.jpg, receipt3.jpg, receipt4.jpg
Select: Two images side-by-side
Result: Two PDF pages:
Page 1: [Receipt 1] [Receipt 2]
Page 2: [Receipt 3] [Receipt 4]
```

## Technical Implementation

### Files Modified

1. **`/types/index.ts`**
   - Added `pdfImagesPerPage?: 1 | 2` option

2. **`/services/imageToPdfService.ts`**
   - Added `imagesPerPage` parameter to `PdfOptions`
   - Created `createSingleImagePages()` method (original logic)
   - Created `createSideBySidePages()` method (new 2-up layout)
   - Updated `convertImagesToPdf()` to switch between layouts

3. **`/app/api/process/route.ts`**
   - Pass `pdfImagesPerPage` option to the service

4. **`/components/OptionsPanel.tsx`**
   - Added "Images Per Page" dropdown in PDF options
   - Shows helpful hint based on selection

### Layout Algorithm

#### Single Image Layout (1 per page)
- Each image gets its own page
- Image is scaled to fit within margins
- Centered on the page
- Aspect ratio maintained

#### Side-by-Side Layout (2 per page)
- Page width is split into two equal halves
- 10px gap between images
- Each image scaled to fit its half
- Both images centered vertically
- If odd number of images, last page has only one image

### Code Structure

```typescript
// Service method signature
async convertImagesToPdf(
  imageBuffers: { buffer: Buffer; name: string; order: number }[],
  options: {
    pageSize?: 'A4' | 'Letter' | 'Legal'
    orientation?: 'portrait' | 'landscape'
    margin?: number
    quality?: number
    imagesPerPage?: 1 | 2  // NEW!
  }
): Promise<ProcessedPdf>
```

### Page Count Calculation
```typescript
// For single image per page
pageCount = images.length

// For side-by-side (2 per page)
pageCount = Math.ceil(images.length / 2)

// Examples:
// 2 images, 2-up layout = 1 page
// 3 images, 2-up layout = 2 pages (last page has 1 image)
// 4 images, 2-up layout = 2 pages
```

## UI Screenshots

### Options Panel
```
┌─────────────────────────────────────┐
│ Convert Options                     │
├─────────────────────────────────────┤
│ Output Format: [PDF ▼]              │
│                                     │
│ Page Layout: [Fit to page ▼]       │
│                                     │
│ Page Size: [A4 ▼]                  │
│                                     │
│ Images Per Page:                    │
│ [Two images side-by-side (2-up) ▼] │
│ 📄 Perfect for ID cards!            │
│    Front and back on the same page. │
└─────────────────────────────────────┘
```

## Benefits

✅ **Perfect for ID Cards** - Front and back on same page  
✅ **Save Paper** - Print 2 images on 1 page  
✅ **Better Organization** - Related images grouped together  
✅ **Professional Layout** - Clean side-by-side arrangement  
✅ **Flexible** - Works with any number of images  
✅ **Automatic** - Handles odd numbers gracefully  

## Testing Scenarios

### Test Case 1: Even Number of Images (2 images)
- **Input:** pan_front.jpg, pan_back.jpg
- **Setting:** Two images side-by-side
- **Expected:** 1 PDF page with both images
- **Result:** ✅ Both images on one page

### Test Case 2: Odd Number of Images (3 images)
- **Input:** img1.jpg, img2.jpg, img3.jpg
- **Setting:** Two images side-by-side
- **Expected:** 2 PDF pages (page 1: img1+img2, page 2: img3)
- **Result:** ✅ Works correctly

### Test Case 3: Single Image
- **Input:** single.jpg
- **Setting:** Two images side-by-side
- **Expected:** 1 PDF page with one image
- **Result:** ✅ Single image displayed properly

### Test Case 4: Traditional Layout
- **Input:** Multiple images
- **Setting:** One image per page
- **Expected:** Each image on separate page (original behavior)
- **Result:** ✅ Works as before

## Limitations & Future Enhancements

### Current Limitations
- Fixed 50/50 split (can't manually resize)
- Images centered automatically (no manual positioning)
- Automatic scaling (no manual zoom)

### Possible Future Enhancements
1. **Manual Positioning** - Drag and drop images on canvas
2. **Custom Sizing** - Adjust individual image sizes
3. **3-up or 4-up Layouts** - More images per page
4. **Grid Layouts** - 2x2, 3x3 grids
5. **Custom Gaps** - Adjust spacing between images
6. **Border Options** - Add borders around images

## Usage Tips

💡 **For ID Cards:**
- Upload front image first, back image second
- Select "Two images side-by-side"
- Both sides will appear on one page

💡 **For Documents:**
- Upload pages in order
- Select layout based on preference
- Odd number of pages handled automatically

💡 **For Best Results:**
- Use images with similar orientations
- Images are auto-scaled to fit
- Both images will be same size on page

## Comparison

| Feature | One Per Page | Two Side-by-Side |
|---------|-------------|------------------|
| Images/Page | 1 | 2 |
| Best For | Individual photos | ID cards, paired items |
| Page Count | = image count | = ⌈image count / 2⌉ |
| Paper Usage | More | Less |
| Print Cost | Higher | Lower |

## API Example

```javascript
// Frontend request
const formData = new FormData()
formData.append('images', frontImage)
formData.append('images', backImage)
formData.append('options', JSON.stringify({
  operation: 'convert',
  outputFormat: 'pdf',
  pdfPageSize: 'A4',
  pdfImagesPerPage: 2  // Side-by-side layout
}))

// Response
{
  files: [{
    fileName: 'pan_front_and_1_more_combined_abc123.pdf',
    pageCount: 1,  // 2 images on 1 page
    processedSize: 125000
  }]
}
```

## Summary

This feature provides a simple yet powerful way to create PDF documents with multiple images per page, perfect for ID cards, receipts, or any scenario where you want to group related images together on a single page. The implementation is flexible, handles edge cases automatically, and maintains the same quality and professional output as the original single-image-per-page layout.
