# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Birthday Notes is a Next.js 14 application for collecting and displaying birthday wishes. It uses password-protected access, stores notes in Vercel Postgres, handles image uploads via Vercel Blob, and integrates with a cloud printing service for PDF generation.

## Development Commands

```bash
# Development server (uses *_DEV environment variables)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### Storage Layer

**Key files**: `lib/storage.ts`, `lib/db-config.ts`

**Database**: Vercel Postgres using `postgres` npm package (NOT `@vercel/postgres`)
- Schema: Single `notes` table (`id`, `name`, `message`, `timestamp`, `images`)
- Auto-initialization via `CREATE TABLE IF NOT EXISTS` on first access
- No migration system - schema changes require manual handling

**Environment-aware database selection**:
```typescript
// lib/db-config.ts exports these helpers
getPostgresUrl()  // Returns POSTGRES_URL_DEV in dev, POSTGRES_URL in prod
getBlobToken()    // Returns BLOB_READ_WRITE_TOKEN_DEV in dev, BLOB_READ_WRITE_TOKEN in prod
```

**Critical**: SQL client is lazily initialized on first use (not at import time) to prevent build-time connection issues. Check `getSQL()` in `lib/storage.ts:16-26`.

### Cloud Print Integration

**Key files**: `lib/cloud-print.ts`, `app/api/cloud-print/route.ts`, `types/cloud-print.ts`

**Request flow**:
1. `POST /api/cloud-print` receives request with optional `noteIds[]` and `encodeImages` boolean
2. `buildCloudPrintRequest()` converts Note[] to CloudPrintRequest format
3. `sendCloudPrintRequest()` POSTs to external service with HMAC auth
4. Service returns PDF binary (NOT URLs) with `Content-Type: application/pdf`
5. API endpoint proxies PDF back to client with download headers

**HMAC Authentication** (lib/cloud-print.ts:156-173):
```
Message: {timestamp}.POST.{path}.{body}
Signature: HMAC-SHA256(message, CLOUD_PRINT_API_SECRET)
Headers: X-API-Key, X-Timestamp, X-Signature
```

**Image handling**: `prepareImages()` can send URLs (default, faster) or base64-encoded (set `encodeImages: true`)

**Reference**: See `CLOUD_PRINT_INTEGRATION.md` for full spec and `CLOUD_PRINT_SERVICE_SPEC.md` for service implementation requirements.

### Authentication & Authorization

**Two-tier system**:
- **Contributors**: `ACCESS_CODE` env var → stored in `sessionStorage` after `/api/verify-access` → included in note submission
- **Admins**: `ADMIN_PASSWORD` env var → sent as `x-admin-password` header on admin API calls

**Important**: Access code uses sessionStorage (NOT cookies). Code is re-verified in request body on each API call to `/api/notes`.

### API Routes Quick Reference

**Public**:
- `POST /api/verify-access` - Validate access code
- `POST /api/notes` - Add note (requires `accessCode` in body)
- `POST /api/upload-image` - Upload images, returns URL array

**Admin** (require `x-admin-password` header):
- `GET /api/notes` - Retrieve all notes
- `POST /api/cloud-print` - Generate PDF from notes
- `GET /api/cloud-print` - Check cloud print config
- `GET /api/init-db` - Initialize database

### Image Upload Flow

**Critical**: Images uploaded BEFORE note submission (two separate requests):
1. User selects files → client shows previews
2. Submit triggered → `POST /api/upload-image` (multipart/form-data) → receive URL array
3. Then `POST /api/notes` with `images: string[]` field

**Constraints**: 5MB max per file, 5 images max per note, stored in Vercel Blob

See `app/submit/page.tsx:71-126` for implementation.

## Environment Variables

See `.env.example` for complete reference with descriptions.

**Dev/Prod split pattern**:
- Development uses `*_DEV` suffixed variables (e.g., `POSTGRES_URL_DEV`)
- Production uses standard names (e.g., `POSTGRES_URL`, auto-injected by Vercel)
- Selection logic in `lib/db-config.ts` based on `NODE_ENV`

**Required**:
- `ACCESS_CODE`, `ADMIN_PASSWORD`
- `POSTGRES_URL_DEV`, `BLOB_READ_WRITE_TOKEN_DEV` (for local dev)

**Optional**:
- `CLOUD_PRINT_SERVICE_URL`, `CLOUD_PRINT_API_KEY`, `CLOUD_PRINT_API_SECRET` (for PDF generation)
- `BIRTHDAY_NAME` (display only)

## Key Conventions

**Import alias**: `@/*` maps to project root (`import { readNotes } from '@/lib/storage'`)

**Type definitions**: Located in `types/` directory
- `types/note.ts` - Core Note interface
- `types/cloud-print.ts` - Cloud print request/response types

**Route handlers**: Next.js App Router API routes in `app/api/*/route.ts`

**Client components**: All pages use `'use client'` directive (no SSR for this app)

**Logging**: Use `logger` from `lib/logger.ts` instead of `console` methods
- `logger.debug()` - Development-only detailed debugging (hidden in production)
- `logger.info()` - General informational messages (shown in all environments)
- `logger.warn()` - Warning messages (shown in all environments)
- `logger.error()` - Error messages (shown in all environments)

Example:
```typescript
import { logger } from '@/lib/logger';

logger.debug('📸 Uploading to DEV blob storage'); // Only in development
logger.error('Error uploading images:', error);    // In all environments
```

## Critical Implementation Notes

### No Migration System
`initializeDatabase()` uses `CREATE TABLE IF NOT EXISTS`. To modify schema:
1. Update CREATE statement in `lib/storage.ts:100-113`
2. Manually migrate data if needed
3. **Always test in dev database first** (`POSTGRES_URL_DEV`)

### Timestamp Handling
Database stores `timestamp` as BIGINT, but Postgres may return it as string. Always parse:
```typescript
timestamp: typeof row.timestamp === 'string' ? parseInt(row.timestamp, 10) : row.timestamp
```
See `lib/storage.ts:52` for reference.

### JSONB Images Field
`images` column stores JSON array. When reading, handle both parsed and string forms:
```typescript
images: row.images ? (typeof row.images === 'string' ? JSON.parse(row.images) : row.images) : []
```

### When Modifying Authentication
- Access code: Update verification in `app/api/notes/route.ts:10-12` AND `app/api/verify-access/route.ts`
- Admin password: Update all route handlers that check `x-admin-password` header
- Remember: sessionStorage is cleared on browser close

### Adding New API Routes
1. Create `app/api/{name}/route.ts`
2. Export `GET`, `POST`, etc. as async functions
3. Use `NextRequest` and return `NextResponse.json()`
4. Add admin check if needed: `request.headers.get('x-admin-password')`

### Markdown Rendering
Uses `marked` library. Rendering happens in:
- Submit page preview: `app/submit/page.tsx:236` (client-side)
- Display pages: Admin/scrapbook/print (client-side)
- Cloud print: Handled by external service (server-side)

Helper: `lib/markdown.ts` exports `renderMarkdown(text: string): string`
