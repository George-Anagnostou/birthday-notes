# Cloud Print Integration

This document describes the cloud printing integration for Birthday Notes, which enables custom PDF generation through an external cloud printing service.

## Overview

The cloud print integration allows administrators to send birthday card data to a dedicated cloud printing service for professional PDF generation and printing. Instead of using the browser's print functionality, cards are processed server-side for consistent, high-quality output.

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Admin     │────────>│  Birthday Notes  │────────>│  Cloud Print    │
│   Panel     │         │  API Endpoint    │         │  Service        │
└─────────────┘         └──────────────────┘         └─────────────────┘
                               │                              │
                               │ CloudPrintRequest            │
                               │ - cards[]                    │
                               │ - metadata                   │
                               │                              │
                               │<─────────────────────────────┘
                               │ CloudPrintResponse
                               │ - pdfUrls[]
                               │ - success
```

## Request Model

### CloudPrintRequest

The main request payload sent to the cloud printing service. PDFs are generated as **5x7 inch portrait cards in color** with decorative elements. Physical printing options (paper type, copies) are handled by the printer, not the PDF generation service.

```typescript
interface CloudPrintRequest {
  cards: CloudPrintCardData[];     // Birthday cards to generate as PDFs
  metadata: CloudPrintMetadata;     // Request metadata
}
```

### CloudPrintCardData

Enhanced note data optimized for printing.

```typescript
interface CloudPrintCardData {
  note: Note;                      // Original note (id, name, message, timestamp, images)
  images: PrintImage[];            // Processed images (URLs or base64)
  formattedDate: string;           // Human-readable date
  renderedContent?: string;        // Optional pre-rendered HTML/markdown
}
```

### PrintImage

Image data that can be either a URL or base64-encoded.

```typescript
interface PrintImage {
  source: string;                  // URL or base64 data URI
  type: 'url' | 'base64';
  originalUrl?: string;            // Original URL if available
  mimeType?: string;               // MIME type (e.g., 'image/jpeg')
}
```

### CloudPrintMetadata

Metadata about the print request.

```typescript
interface CloudPrintMetadata {
  requestId: string;               // Unique request identifier
  requestedBy?: string;            // Who initiated the request
  requestedAt: number;             // Timestamp (ms since epoch)
  totalCards: number;              // Number of cards in request
  environment: 'development' | 'production';
  appVersion?: string;             // App version info
}
```

## Environment Setup

Add the cloud printing service URL to your environment variables:

```bash
# .env.local or .env
CLOUD_PRINT_SERVICE_URL="https://your-cloud-print-service.com/api/print"
```

## API Usage

### Endpoint: POST `/api/cloud-print`

Send birthday notes to the cloud printing service.

**Headers:**
```
x-admin-password: <admin-password>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  noteIds?: string[];              // Optional: specific note IDs to print (if omitted, prints all)
  encodeImages?: boolean;          // Optional: encode images as base64 (default: false)
}
```

**Response:**
```typescript
{
  success: boolean;
  requestId: string;
  pdfUrls: string[];               // URLs to download generated PDFs
  pdfCount: number;
  cardsProcessed: number;
  processingTime?: number;         // In milliseconds
  error?: string;                  // If success is false
}
```

### Endpoint: GET `/api/cloud-print`

Check cloud print service configuration status.

**Headers:**
```
x-admin-password: <admin-password>
```

**Response:**
```json
{
  "configured": true,
  "serviceUrl": "[CONFIGURED]",
  "status": "ready"
}
```

## Example Usage

### JavaScript/TypeScript Example

```typescript
// Print all birthday notes with default options
async function printAllCards() {
  const response = await fetch('/api/cloud-print', {
    method: 'POST',
    headers: {
      'x-admin-password': 'your-admin-password',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),  // Empty body prints all notes with defaults
  });

  const result = await response.json();

  if (result.success) {
    console.log(`Generated ${result.pdfCount} PDFs`);
    result.pdfUrls.forEach(url => {
      console.log(`Download: ${url}`);
    });
  }
}

// Print specific notes
async function printSelectedCards(noteIds: string[]) {
  const response = await fetch('/api/cloud-print', {
    method: 'POST',
    headers: {
      'x-admin-password': 'your-admin-password',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      noteIds: noteIds,
      encodeImages: false,  // Use URLs instead of base64
    }),
  });

  const result = await response.json();
  return result;
}
```

### cURL Example

```bash
# Print all cards
curl -X POST https://your-app.vercel.app/api/cloud-print \
  -H "x-admin-password: your-admin-password" \
  -H "Content-Type: application/json" \
  -d '{}'

# Print specific cards
curl -X POST https://your-app.vercel.app/api/cloud-print \
  -H "x-admin-password: your-admin-password" \
  -H "Content-Type: application/json" \
  -d '{
    "noteIds": ["note-123", "note-456"],
    "encodeImages": false
  }'
```

## Utility Functions

The `/lib/cloud-print.ts` module provides helper functions:

### `buildCloudPrintRequest()`

Builds a complete cloud print request from notes.

```typescript
import { buildCloudPrintRequest } from '@/lib/cloud-print';

const notes = await readNotes();
const request = await buildCloudPrintRequest(notes, {
  encodeImages: false,
  requestedBy: 'admin',
});
```

### `sendCloudPrintRequest()`

Sends a request to the cloud printing service.

```typescript
import { sendCloudPrintRequest } from '@/lib/cloud-print';

const response = await sendCloudPrintRequest(
  request,
  'https://your-cloud-print-service.com/api/print'
);
```

### `prepareImages()`

Converts image URLs to PrintImage format, optionally encoding as base64.

```typescript
import { prepareImages } from '@/lib/cloud-print';

// Use URLs (faster, recommended)
const imageUrls = ['https://...', 'https://...'];
const printImages = await prepareImages(imageUrls, false);

// Or encode as base64 (larger payload, but self-contained)
const printImagesBase64 = await prepareImages(imageUrls, true);
```

## Cloud Print Service Requirements

Your cloud printing service should accept the `CloudPrintRequest` format and return a `CloudPrintResponse`. Here's what the service needs to handle:

1. **Accept POST requests** with `CloudPrintRequest` JSON body
2. **Process card data** into PDF format (5x7 inch portrait cards in color)
3. **Handle images** from URLs or base64-encoded data
4. **Render markdown** content in messages
5. **Apply decorative styling** (borders, emojis, fonts: Playfair Display for headings, Open Sans for body)
6. **Generate PDFs** and upload to accessible storage
7. **Return response** with PDF download URLs

### Expected Response Format

```typescript
{
  success: true,
  requestId: "print-1234567890-abc123",
  pdfUrls: [
    "https://storage.example.com/pdfs/birthday-cards-1.pdf",
    "https://storage.example.com/pdfs/birthday-cards-2.pdf"
  ],
  pdfCount: 2,
  processingTime: 3500
}
```

## PDF Generation Specifications

The cloud service should generate PDFs matching the current browser-based print page:

- **Card Size:** 5 inches × 7 inches (portrait orientation)
- **Color Mode:** Color
- **Decorations:** Include borders, emojis (💝 ✨ 🎂), and gradient backgrounds
- **Fonts:**
  - Heading: Playfair Display
  - Body: Open Sans
- **Layout:** One card per page with decorative header, sender name badge, message content, images (up to 5), and signature footer with date

Physical printing options (paper type, number of copies) are handled by the printer, not the PDF generation service.

## Image Handling

### URL Mode (Recommended)

By default, images are sent as URLs. The cloud print service fetches them:

**Pros:**
- Smaller request payload
- Faster processing
- No encoding overhead

**Cons:**
- Cloud service must fetch images
- Requires images to be publicly accessible

### Base64 Mode

Set `encodeImages: true` to encode images as base64:

**Pros:**
- Self-contained request
- No external fetching required
- Works with private images

**Cons:**
- Much larger payload (~33% larger)
- Slower processing
- Higher bandwidth usage

## Error Handling

The API returns appropriate error responses:

| Status | Error | Reason |
|--------|-------|--------|
| 401 | Unauthorized | Invalid admin password |
| 400 | No notes found to print | No notes in database or invalid noteIds |
| 500 | Cloud print service URL not configured | CLOUD_PRINT_SERVICE_URL not set |
| 500 | Failed to process cloud print request | Cloud service error or network issue |

## Type Definitions

All TypeScript types are defined in:
- `/types/cloud-print.ts` - Cloud print request/response types
- `/types/note.ts` - Original Note interface

## Security

- All endpoints require admin password authentication
- Images are validated before processing
- Request IDs are randomly generated
- Environment variables protect service URLs

## Future Enhancements

Potential improvements for the cloud print integration:

- [ ] Batch processing for large numbers of cards
- [ ] Progress tracking for long-running print jobs
- [ ] Webhook support for async PDF generation
- [ ] Custom template support
- [ ] Print preview generation
- [ ] Multi-language support
- [ ] Print job history and logs
