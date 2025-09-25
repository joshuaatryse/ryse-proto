# Property Import Features

## Overview
The property management system now includes advanced import capabilities to streamline property onboarding:

1. **Manual Entry** - Traditional form-based property addition
2. **PDF Lease Extraction** - AI-powered extraction from lease documents
3. **CSV Bulk Import** - Import multiple properties at once

## Features

### 1. Property Tray Interface
- Replaced modal with a full-height drawer/tray for better user experience
- Tabbed interface for different import methods
- Persistent form state across tab switches

### 2. PDF Lease Extraction
**How it works:**
1. Upload a PDF lease agreement
2. Gemini AI analyzes the document
3. Automatically extracts property details, lease terms, and owner information
4. Pre-fills the property form for review and submission

**Extracted Fields:**
- Property address and details
- Bedroom/bathroom counts
- Monthly rent and security deposit
- Lease start/end dates
- Owner/landlord information
- Tenant information (for reference)

**Setup Required:**
- Add `GEMINI_API_KEY` to your `.env.local` file
- Get API key from: https://aistudio.google.com/app/apikey

### 3. CSV Bulk Import
**Features:**
- Download template CSV with example data
- Import multiple properties in one operation
- Automatic owner creation/matching
- Validation and error reporting

**CSV Template Columns:**
```csv
propertyName, propertyType, street, unit, city, state, zipCode, bedrooms, bathrooms, squareFeet, yearBuilt, estimatedValue, purchasePrice, purchaseDate, monthlyRent, securityDeposit, leaseStartDate, leaseEndDate, occupancyStatus, ownerName, ownerEmail, ownerPhone
```

**Property Types:**
- single_family
- multi_family
- condo
- townhouse
- apartment
- commercial
- other

**Occupancy Status:**
- occupied
- vacant
- maintenance

## API Endpoints

### `/api/extract-lease`
- **Method:** POST
- **Purpose:** Extract property data from PDF lease
- **Payload:** FormData with file and propertyManagerId
- **Returns:** Extracted property data in JSON format

### `/api/import-properties`
- **Method:** POST
- **Purpose:** Import properties from CSV file
- **Payload:** FormData with file and propertyManagerId
- **Returns:** Import results with success/error details

## Implementation Details

### Components
- **AddPropertyTray.tsx** - Main tray component with all import methods
- Replaces the previous modal implementation
- Located in `/components/properties/`

### Convex Mutations
- `properties.create` - Create single property
- `properties.createBulk` - Create multiple properties
- `owners.create` - Create or get existing owner

### UI/UX Improvements
- Progress indicators for file processing
- Real-time extraction status
- Error handling with user-friendly messages
- Form validation before submission

## Usage Instructions

### For PDF Import:
1. Click "Add Property" button
2. Select "Upload Lease PDF" tab
3. Click "Select PDF File" and choose lease document
4. Wait for AI extraction (progress shown)
5. Review extracted data in "Manual Entry" tab
6. Make any necessary corrections
7. Click "Add Property" to save

### For CSV Import:
1. Click "Add Property" button
2. Select "Bulk CSV Import" tab
3. Download template CSV for reference
4. Prepare your CSV file with property data
5. Click "Select CSV File" and upload
6. System will process and import all valid properties
7. Review import results showing success/error counts

## Error Handling
- Invalid file types rejected with message
- Missing required fields highlighted
- Duplicate owner emails handled automatically
- Failed imports logged with row numbers and reasons

## Security Considerations
- PDF files processed server-side only
- API keys stored securely in environment variables
- File size limits enforced
- Input validation on all fields

## Future Enhancements
- Support for additional document types (Word, etc.)
- OCR for scanned lease documents
- Batch editing of imported properties
- Import history and rollback functionality