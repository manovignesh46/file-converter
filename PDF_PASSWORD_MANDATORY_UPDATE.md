# PDF Password Field - Made Mandatory

## Changes Made

### 1. Updated `page.tsx` - Added Validation Logic
Created a `canProcess` function that:
- Checks if files are uploaded
- **For `pdf-remove-password` operation**: Validates that password field is not empty
- Returns `true` only when all conditions are met

```typescript
const canProcess = useCallback(() => {
  if (images.length === 0) return false
  
  // For PDF password removal, password is required
  if (options.operation === 'pdf-remove-password') {
    return !!(options.pdfPassword && options.pdfPassword.trim().length > 0)
  }
  
  return true
}, [images.length, options.operation, options.pdfPassword])
```

### 2. Updated `OptionsPanel.tsx` - Visual Indicators

#### Password Field
- Added red asterisk (*) to label indicating required field
- Added `required` attribute to input field
- Updated help text with "Required:" prefix in red color

```tsx
<label className="block text-sm font-medium text-gray-700 mb-2">
  PDF Password <span className="text-red-500">*</span>
</label>
<input
  type="password"
  value={options.pdfPassword || ''}
  onChange={(e) => updateOption('pdfPassword', e.target.value)}
  className="input-field"
  placeholder="Enter current password"
  required
/>
<p className="text-xs text-gray-500 mt-1">
  <span className="text-red-500">Required:</span> The current password is needed to unlock the PDF.
</p>
```

#### Process Button Feedback
Updated the disabled state message to show:
- "Upload files to start processing" - when no files uploaded
- "Enter PDF password to continue" - when PDF password removal is selected but password is empty

## User Experience

### Before
- User could click "Process Files" without entering password
- Would get an error after processing started
- Confusing and wastes time

### After ✅
- "Process Files" button is disabled until password is entered
- Clear visual indicator (red asterisk) shows field is required
- Helpful message "Enter PDF password to continue" appears below button
- User knows exactly what's needed before clicking process

## Testing
1. Upload a password-protected PDF
2. Select "Remove Password" operation
3. Notice:
   - Password field has red asterisk (*)
   - Help text says "Required:"
   - Process button is disabled (grayed out)
   - Message shows "Enter PDF password to continue"
4. Enter password
5. Process button becomes enabled (blue)
6. Click to process the PDF

## Benefits
✅ Prevents users from forgetting to enter password  
✅ Clear visual feedback about what's required  
✅ Better user experience with immediate validation  
✅ Saves processing time by validating upfront  
✅ Consistent with good form design practices
