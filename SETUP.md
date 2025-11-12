# Birthday Notes - Vercel Storage Setup

This app uses Vercel Postgres and Vercel Blob for production-ready storage.

> **Note**: Vercel Postgres is powered by Supabase. Your connection URLs will be `supabase.com` domains, which is expected and correct.

## 🔒 Dev/Prod Isolation

**Important**: Development and production use **separate** databases and blob storage to prevent accidental data corruption.

- **Development** (`npm run dev`): Uses `*_DEV` environment variables → separate dev database
- **Production** (Vercel deployment): Uses standard environment variables → separate prod database

All data is stored in Vercel's cloud (even in development), but completely isolated between environments.

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# Access control
ACCESS_CODE=your-secret-access-code
ADMIN_PASSWORD=your-admin-password

# ==============================================================================
# DEVELOPMENT STORAGE (required for local dev)
# ==============================================================================
POSTGRES_URL_DEV="postgres://..."          # Your dev database
BLOB_READ_WRITE_TOKEN_DEV="vercel_blob_..." # Your dev blob store

# ==============================================================================
# PRODUCTION STORAGE (auto-injected by Vercel)
# ==============================================================================
POSTGRES_URL="postgres://..."              # Your prod database
BLOB_READ_WRITE_TOKEN="vercel_blob_..."    # Your prod blob store
```

## Setup Instructions

### 1. Create Separate Dev & Prod Storage

#### Step 1: Create Development Storage

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **Postgres**
   - Name it: `birthday-notes-dev`
   - Click **Create**
4. Click **Create Store** → **Blob**
   - Name it: `birthday-photos-dev`
   - Click **Create**
5. Copy the environment variables:
   - From Postgres → `.env` tab → Copy `POSTGRES_URL` → paste as `POSTGRES_URL_DEV` in your `.env.local`
   - From Blob → Settings → Copy `BLOB_READ_WRITE_TOKEN` → paste as `BLOB_READ_WRITE_TOKEN_DEV`

#### Step 2: Create Production Storage

1. In Vercel Dashboard → **Storage** tab
2. Click **Create Database** → **Postgres**
   - Name it: `birthday-notes-prod`
   - Click **Create**
3. Click **Create Store** → **Blob**
   - Name it: `birthday-photos-prod`
   - Click **Create**
4. **Connect to your Vercel project**:
   - Go to your project → **Storage** tab
   - Connect the prod Postgres and Blob stores
   - Vercel will auto-inject environment variables in production

### 2. Initialize the Database

The database table will be created automatically on first use:

```bash
# Start your development server
npm run dev

# Submit a test note - this will auto-create the table
```

Or manually run the schema in Vercel Dashboard:
- Go to Vercel Dashboard → Storage → Your DEV Postgres → Query
- Paste and run the contents of `db/schema.sql`

### 3. Verify Environment Separation

Check the console logs when running your app:

```bash
npm run dev
# You should see: 📊 Reading from DEV database
# You should see: 📸 Uploading to DEV blob storage
```

In production (Vercel), logs won't show these dev indicators.

### 4. Production Deployment

1. Push your code to GitHub
2. Vercel auto-deploys
3. Production environment uses the prod database (already connected)
4. Done! Dev and prod are completely separated

## How It Works

### Environment Detection

The app automatically detects the environment and uses the correct storage:

```typescript
// In development (NODE_ENV=development)
POSTGRES_URL_DEV → Dev database
BLOB_READ_WRITE_TOKEN_DEV → Dev blob storage

// In production (on Vercel)
POSTGRES_URL → Prod database
BLOB_READ_WRITE_TOKEN → Prod blob storage
```

### File Organization

Images are stored with environment prefixes:

```
Dev:  birthday-photos/dev/1234567890-abc123.jpg
Prod: birthday-photos/prod/1234567890-abc123.jpg
```

This makes it easy to identify and clean up dev images in the Vercel Dashboard.

## Resetting Data (Development)

### Clear all dev notes:

Go to Vercel Dashboard → Storage → `birthday-notes-dev` → Query:

```sql
DELETE FROM notes;
```

### Drop and recreate dev table:

```sql
DROP TABLE notes;

CREATE TABLE notes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_timestamp ON notes(timestamp DESC);
```

### Clear dev images:

Go to Vercel Dashboard → Storage → `birthday-photos-dev` → Browse files → Delete

## Troubleshooting

### "Database connection error" in development

- ✅ Check `.env.local` has `POSTGRES_URL_DEV`
- ✅ Verify the URL is correct (copy from Vercel Dashboard)
- ✅ Make sure dev database exists in Vercel Dashboard

### "Blob storage not configured"

- ✅ Check `.env.local` has `BLOB_READ_WRITE_TOKEN_DEV`
- ✅ Verify the token is correct (copy from Vercel Dashboard)
- ✅ Make sure dev blob store exists

### Production not working after deployment

- ✅ Ensure prod Postgres is connected to project in Vercel Dashboard
- ✅ Ensure prod Blob is connected to project
- ✅ Check Vercel project settings → Environment Variables
- ✅ Redeploy if you connected storage after initial deployment

### Accidentally using prod database in dev

**This shouldn't happen** with the current setup! The app explicitly uses:
- `POSTGRES_URL_DEV` in development
- `POSTGRES_URL` in production

Check your `.env.local` - make sure you have `POSTGRES_URL_DEV` set correctly.

## Free Tier Limits

### Vercel Postgres (per database)
- 60 hours compute time/month
- 256 MB storage
- **Two databases** (dev + prod) = 120 hours total ✅

### Vercel Blob (per store)
- 500k reads/month
- 100k writes/month
- 5GB bandwidth
- **Two stores** (dev + prod) fit comfortably in free tier ✅

## Cost Safety

With this setup:
- ✅ Dev mistakes don't affect production
- ✅ Both dev and prod fit in free tier
- ✅ Can delete/reset dev data anytime
- ✅ Clear separation makes debugging easier

## Next Steps

1. ✅ Create dev and prod storage in Vercel Dashboard
2. ✅ Set up `.env.local` with `*_DEV` variables
3. ✅ Run `npm run dev` - should see "DEV database" in logs
4. ✅ Test submitting a note with images
5. ✅ Deploy to Vercel
6. ✅ Verify production uses prod database (check Vercel logs)

You're all set! Happy developing with peace of mind. 🎉
