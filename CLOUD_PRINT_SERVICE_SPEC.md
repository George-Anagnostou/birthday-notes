# Cloud Print Service - Technical Specification

This document provides technical specifications for building a cloud printing service to generate PDFs from Birthday Notes data.

## API Endpoint

Your cloud print service must provide a single HTTP endpoint that accepts POST requests.

**Endpoint:** `POST /api/print`

**Method:** `POST`

**Content-Type:** `application/json`

**Authentication:** TODO

## Request Format

### HTTP Request

```http
POST /api/print HTTP/1.1
Host: your-cloud-print-service.com
Content-Type: application/json

{
  "cards": [...],
  "metadata": {...}
}
```

### Request Body Schema

```typescript
{
  "cards": CloudPrintCardData[],
  "metadata": CloudPrintMetadata
}
```

#### CloudPrintCardData

Each card object in the `cards` array:

```typescript
{
  "note": {
    "id": string,              // Unique note ID (e.g., "note-1699564234567-abc123")
    "name": string,            // Sender's name (max 100 chars)
    "message": string,         // Birthday message in Markdown format (max 5000 chars)
    "timestamp": number,       // Unix timestamp in milliseconds
    "images": string[]         // Optional: Array of image URLs (0-5 images)
  },
  "images": [
    {
      "source": string,        // Either URL or base64 data URI
      "type": "url" | "base64",
      "originalUrl": string,   // Optional: original URL if available
      "mimeType": string       // Optional: e.g., "image/jpeg", "image/png"
    }
  ],
  "formattedDate": string,     // Human-readable date (e.g., "November 12, 2025")
  "renderedContent": string    // Optional: pre-rendered HTML (usually omitted)
}
```

#### CloudPrintMetadata

Request metadata:

```typescript
{
  "requestId": string,              // Unique request ID (e.g., "print-1699564234567-xyz789")
  "requestedBy": string,            // Optional: who requested (e.g., "admin")
  "requestedAt": number,            // Unix timestamp in milliseconds
  "totalCards": number,             // Number of cards in this request
  "environment": "development" | "production",
  "appVersion": string              // Optional: app version
}
```

### Example Request Payload

```json
{
  "cards": [
    {
      "note": {
        "id": "note-1699564234567-abc123",
        "name": "John Doe",
        "message": "# Happy Birthday!\n\nWishing you all the best on your special day! 🎉\n\nYou're an amazing friend and I'm so grateful to know you.\n\n- John",
        "timestamp": 1699564234567,
        "images": [
          "https://blob.vercel-storage.com/birthday-photos/prod/1699564234567-image1.jpg"
        ]
      },
      "images": [
        {
          "source": "https://blob.vercel-storage.com/birthday-photos/prod/1699564234567-image1.jpg",
          "type": "url",
          "originalUrl": "https://blob.vercel-storage.com/birthday-photos/prod/1699564234567-image1.jpg"
        }
      ],
      "formattedDate": "November 9, 2023"
    },
    {
      "note": {
        "id": "note-1699564456789-def456",
        "name": "Jane Smith",
        "message": "Hope your birthday is as wonderful as you are! 💝",
        "timestamp": 1699564456789,
        "images": []
      },
      "images": [],
      "formattedDate": "November 9, 2023"
    }
  ],
  "metadata": {
    "requestId": "print-1699564500000-xyz789",
    "requestedBy": "admin",
    "requestedAt": 1699564500000,
    "totalCards": 2,
    "environment": "production",
    "appVersion": "1.0.0"
  }
}
```

## Response Format

### Success Response (Direct PDF Return - Current Implementation)

**Status Code:** `200 OK`

**Response Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename=birthday-cards-{requestId}.pdf`
- `X-Processing-Time-Ms: {milliseconds}`

**Response Body:**
Binary PDF data containing all cards combined into a single PDF document.

**Note:** This service returns the PDF directly rather than uploading to storage and returning URLs. This approach is optimal for the admin "print all" workflow where the PDF is downloaded once and sent to a printer.

### Alternative Success Response (URL-based - For Reference)

If implementing storage URLs in the future:

```typescript
{
  "success": true,
  "requestId": string,           // Echo back the request ID
  "pdfUrls": string[],          // Array of URLs to download generated PDFs
  "pdfCount": number,           // Number of PDFs generated
  "processingTime": number      // Optional: processing time in milliseconds
}
```

### Error Response

**Status Code:** `400` (Bad Request), `500` (Internal Server Error), etc.

**Content-Type:** `text/plain` or `application/json` (depending on error type)

**Response Body:**

Error message as plain text or simple error description.

**Example Error Response:**

```
Invalid request body: unexpected end of JSON input
```

Or for validation errors:

```
card 0: note.name is required
```

## Webapp Integration Instructions

### Client-Side Implementation

The birthday-notes webapp should handle the direct PDF response as follows:

#### TypeScript/JavaScript Example

```typescript
async function printAllCards(cards: CloudPrintCardData[], metadata: CloudPrintMetadata) {
  const printRequest = {
    cards,
    metadata
  };

  try {
    const response = await fetch(`${CLOUD_PRINT_SERVICE_URL}/api/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printRequest)
    });

    // Check if response is successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PDF generation failed: ${errorText}`);
    }

    // Check content type to ensure we got a PDF
    const contentType = response.headers.get('content-type');
    if (contentType !== 'application/pdf') {
      const errorText = await response.text();
      throw new Error(`Expected PDF but got: ${errorText}`);
    }

    // Get processing time from header (optional)
    const processingTime = response.headers.get('X-Processing-Time-Ms');
    console.log(`PDF generated in ${processingTime}ms`);

    // Download the PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `birthday-cards-${metadata.requestId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
}
```

#### React Hook Example

```typescript
import { useState } from 'react';

export function usePrintCards() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const printCards = async (cards: CloudPrintCardData[]) => {
    setIsPrinting(true);
    setError(null);

    const metadata: CloudPrintMetadata = {
      requestId: `print-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestedAt: Date.now(),
      totalCards: cards.length,
      environment: process.env.NODE_ENV as 'development' | 'production',
    };

    try {
      const response = await fetch(`${process.env.CLOUD_PRINT_SERVICE_URL}/api/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, metadata })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birthday-cards-${metadata.requestId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPrinting(false);
    }
  };

  return { printCards, isPrinting, error };
}
```

#### Usage in Component

```typescript
function PrintButton() {
  const { printCards, isPrinting, error } = usePrintCards();
  const cards = useCardsFromDatabase(); // Your data fetching logic

  const handlePrint = async () => {
    const result = await printCards(cards);
    if (result.success) {
      toast.success('PDF downloaded successfully!');
    } else {
      toast.error(`Failed to generate PDF: ${result.error}`);
    }
  };

  return (
    <div>
      <button onClick={handlePrint} disabled={isPrinting}>
        {isPrinting ? 'Generating PDF...' : 'Print All Cards'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Key Differences from URL-based Approach

| Aspect | Direct PDF Return (Current) | URL-based Return (Alternative) |
|--------|----------------------------|-------------------------------|
| Response Type | Binary PDF (`application/pdf`) | JSON with URLs |
| Success Check | `response.ok && contentType === 'application/pdf'` | `response.ok && data.success` |
| Download | Immediate blob download | Fetch from `pdfUrls[0]` |
| Error Format | Plain text | JSON with `error` field |
| Caching | Browser handles via blob URL | URLs can be cached/shared |
| Storage | No cloud storage needed | Requires S3/Blob storage |

### Testing the Integration

```bash
# Test request from webapp
curl -X POST http://localhost:8080/api/print \
  -H "Content-Type: application/json" \
  -d '{
    "cards": [{
      "note": {
        "id": "test-1",
        "name": "Test User",
        "message": "Test message",
        "timestamp": 1699564234567,
        "images": []
      },
      "images": [],
      "formattedDate": "November 12, 2025"
    }],
    "metadata": {
      "requestId": "test-123",
      "requestedAt": 1699564500000,
      "totalCards": 1,
      "environment": "development"
    }
  }' \
  --output test.pdf

# Verify PDF was created
file test.pdf
```

## PDF Generation Requirements

### Page Specifications

- **Page Size:** 5 inches × 7 inches (portrait orientation)
- **Page Margins:** 0.75 inches on all sides (as padding within the card)
- **Color Mode:** Full color (RGB)
- **Format:** PDF 1.4 or higher
- **Pages:** One card per page

 ## Image Handling

### Image Types

Your service will receive images in one of two formats:

1. **URL** (most common):
   ```json
   {
     "source": "https://blob.vercel-storage.com/...",
     "type": "url"
   }
   ```
   - Fetch the image from the URL
   - Images are publicly accessible (no auth required)
   - Supported formats: JPEG, PNG, GIF, WebP

2. **Base64** (optional):
   ```json
   {
     "source": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
     "type": "base64",
     "mimeType": "image/jpeg"
   }
   ```
   - Decode the base64 data URI
   - Extract the image data after the comma

### Image Processing

- Fetch/decode all images before PDF generation
- Resize/compress if needed to fit layout (max height: 1.5in)
- Handle missing/failed images gracefully (skip or use placeholder)
- Maintain aspect ratios

## PDF Generation Approaches

### Option 1: Headless Browser (Recommended)

Use a headless browser to render HTML/CSS to PDF.

**Tools:**
- **Puppeteer** (Node.js)
- **Playwright** (Node.js, Python)
- **wkhtmltopdf** (CLI)

**Pros:**
- Perfect CSS support
- Easy to match reference design
- Handles complex layouts

**Example (Puppeteer):**
```javascript
const puppeteer = require('puppeteer');

async function generatePDF(cards) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Generate HTML from cards
  const html = generateHTML(cards);
  await page.setContent(html);

  // Generate PDF with exact page size
  const pdf = await page.pdf({
    width: '5in',
    height: '7in',
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  return pdf;
}
```

## Implementation Checklist

- [ ] Set up HTTP server with POST endpoint
- [ ] Parse incoming JSON request
- [ ] Validate request schema (check required fields)
- [ ] Fetch images from URLs (or decode base64)
- [ ] Upload PDF to storage (S3, Google Cloud Storage, etc.)
- [ ] Generate public download URL
- [ ] Return success response with PDF URL
- [ ] Handle errors gracefully (image fetch failures, invalid data, etc.)
- [ ] Add logging for debugging

**Considerations:**
- Set appropriate expiration (e.g., 24 hours, 7 days, permanent)
- Use unique filenames (include requestId)
- Consider CORS if PDFs need browser access
- Ensure URLs are publicly accessible or use presigned URLs

## Example Workflow

1. **Receive Request**
   ```
   POST /api/print
   Body: { cards: [...], metadata: {...} }
   ```

2. **Process Cards**
   - Loop through each card
   - Fetch/decode images

3. **Generate PDF**

4. **Upload PDF**
   - Upload to S3/storage
   - Generate public URL
   - Filename: `birthday-cards-{requestId}.pdf`

5. **Return Response**
   ```json
   {
     "success": true,
     "requestId": "print-1699564500000-xyz789",
     "pdfUrls": ["https://storage.com/pdfs/birthday-cards-print-1699564500000-xyz789.pdf"],
     "pdfCount": 1,
     "processingTime": 3542
   }
   ```

## Performance Considerations

- **Parallel Processing:** Process image fetching in parallel
- **Caching:** Cache fonts, templates, common assets
- **Timeouts:** Set reasonable timeouts for image fetching (5-10 seconds)
- **Rate Limiting:** Protect your service from abuse
- **Async Processing:** For large requests, consider async job queue

## Testing

### Test Request

```bash
curl -X POST https://your-cloud-print-service.com/api/print \
  -H "Content-Type: application/json" \
  -d '{
    "cards": [{
      "note": {
        "id": "test-1",
        "name": "Test User",
        "message": "# Test Message\n\nThis is a **test** message with *emphasis*.\n\n- Item 1\n- Item 2",
        "timestamp": 1699564234567,
        "images": []
      },
      "images": [],
      "formattedDate": "November 12, 2025"
    }],
    "metadata": {
      "requestId": "test-request-1",
      "requestedAt": 1699564500000,
      "totalCards": 1,
      "environment": "development"
    }
  }'
```

### Validation Checklist

- [ ] Verify PDF is exactly 5×7 inches
- [ ] Check all cards are present (one per page)
- [ ] Verify images loaded correctly
- [ ] Test with 0 images
- [ ] Test with 1 image
- [ ] Test with 5 images (verify 2-column grid layout)
- [ ] Test with various message lengths (short, medium, long)
- [ ] Test error handling:
  - Invalid/missing requestId
  - Malformed card data
  - Bad image URLs
  - Network timeouts
  - Invalid JSON

## Security Considerations

- **Input Validation:** Validate all incoming data (required fields, data types)
- **URL Whitelisting:** Only allow image URLs from trusted domains
  - Recommended: `*.vercel-storage.com`, `*.blob.vercel-storage.com`
- **Size Limits:** Limit request size (e.g., max 10MB JSON payload)
- **Image Size Limits:** Validate image file sizes before processing
- **Rate Limiting:** Prevent abuse (e.g., max 100 requests per hour per IP)
- **Authentication:** Consider API keys, bearer tokens, or OAuth
- **SSRF Protection:** Validate image URLs to prevent Server-Side Request Forgery
  - Block internal IPs (localhost, 127.0.0.1, 10.x.x.x, 192.168.x.x)
  - Block cloud metadata endpoints

## Support

If you need any clarification or have questions while building the service, refer to:

- **Request Types:** `/types/cloud-print.ts`
- **Integration Guide:** `/CLOUD_PRINT_INTEGRATION.md`
- **Reference Design:** `/app/print/page.tsx`

The Birthday Notes app will send requests to the URL configured in `CLOUD_PRINT_SERVICE_URL` environment variable.
