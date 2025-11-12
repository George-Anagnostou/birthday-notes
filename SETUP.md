# Birthday Notes - Vercel Storage Setup

This app uses Vercel Postgres and Vercel Blob for production-ready storage.

## Environment Variables

Create a `.env.local` file in the project root with these variables:

```bash
# Access control
ACCESS_CODE=your-secret-access-code
ADMIN_PASSWORD=your-admin-password

# Vercel Postgres (automatically added when you connect the database)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Vercel Blob (automatically added when you connect blob storage)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

## Setup Instructions

### 1. Local Development Setup

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project to Vercel
vercel link

# Pull environment variables (includes Postgres & Blob credentials)
vercel env pull .env.local
```

#### Option B: Manual Setup
If you want to set up Vercel Postgres and Blob locally for development:

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Create a **Postgres** database
4. Create a **Blob** store
5. Copy the environment variables to `.env.local`

### 2. Initialize the Database

The database table will be created automatically on first use, but you can also initialize it manually:

```bash
# Start your development server
npm run dev

# The table will be created on the first API request
# Or you can create it manually using the Vercel Postgres dashboard
```

Alternatively, run the schema SQL directly in the Vercel Postgres dashboard:
- Go to Vercel Dashboard → Storage → Your Postgres DB → Query
- Paste and run the contents of `db/schema.sql`

### 3. Production Deployment

1. Push your code to GitHub
2. Deploy to Vercel (automatic if connected)
3. Add Storage in Vercel Dashboard:
   - Go to your project → **Storage** tab
   - Click **Create Database** → **Postgres**
   - Click **Create Store** → **Blob**
4. Vercel automatically adds environment variables to your deployment
5. Redeploy if needed

## Resetting Data (Development)

To reset your development database:

### Clear all notes:
```sql
DELETE FROM notes;
```

### Drop and recreate table:
```sql
DROP TABLE notes;

CREATE TABLE notes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  images TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_timestamp ON notes(timestamp DESC);
```

Run these commands in:
- **Vercel Dashboard**: Storage → Your Postgres DB → Query tab
- **Or locally**: Using a Postgres client connected to your dev database

### Clear blob storage:
Go to Vercel Dashboard → Storage → Your Blob Store → Delete individual files

## How It Works

### Data Flow

1. **User submits note with images**:
   - Images uploaded to `/api/upload-image` → Vercel Blob
   - Returns image URLs
   - Note + image URLs sent to `/api/notes` → Vercel Postgres

2. **Viewing notes**:
   - API fetches from Postgres (includes image URLs)
   - Browser loads images from Vercel Blob CDN

### Why This Approach?

- **Vercel's filesystem is ephemeral** - file writes are lost after function execution
- **Postgres** stores structured data (notes metadata)
- **Blob** stores large binary files (images)
- Both services are serverless-friendly and scale automatically
- Free tier is generous for personal projects

## Troubleshooting

### Database connection errors
- Ensure `.env.local` has all Postgres variables
- Run `vercel env pull` to sync latest credentials
- Check Vercel Dashboard → Storage → Postgres → Connection pooling is enabled

### Image upload fails
- Ensure `BLOB_READ_WRITE_TOKEN` is set
- Check file size < 5MB
- Verify file type is image/*

### Notes not persisting
- Check Vercel logs for errors
- Ensure database table exists (check Vercel Dashboard → Storage → Postgres → Data)
- Verify Postgres connection string is valid

## Free Tier Limits

### Vercel Postgres
- 60 hours compute time/month
- 256 MB storage
- Sufficient for hundreds of notes

### Vercel Blob
- 500k reads/month
- 100k writes/month
- 5GB bandwidth
- Sufficient for dozens of image uploads

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Set up `.env.local` with environment variables
3. ✅ Run development server: `npm run dev`
4. ✅ Test note submission with images
5. ✅ Deploy to Vercel
6. ✅ Connect Postgres and Blob in Vercel Dashboard
7. ✅ Redeploy and test in production
