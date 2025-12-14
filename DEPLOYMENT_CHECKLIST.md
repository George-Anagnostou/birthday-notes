# Deployment Checklist for Multiple Recipients

Use this checklist to ensure each Vercel project is properly configured.

## For Each Vercel Project

### ✅ Project 1: [Your Project Name]
**Vercel URL:** `https://_____.vercel.app`
**Recipient:** `_____`

### ✅ Project 2: [Your Project Name]
**Vercel URL:** `https://_____.vercel.app`
**Recipient:** `_____`

---

## Step-by-Step Verification (Do for EACH project)

### 1. Storage Configuration

Go to **Vercel Dashboard** → Select Project → **Storage** tab

- [ ] **Postgres Database Connected**
  - Database name: `_____________`
  - Status: Connected ✅

- [ ] **Blob Storage Connected**
  - Storage name: `_____________`
  - Status: Connected ✅

**Important:** Click on each storage item and verify it shows your project in "Connected Projects"

### 2. Environment Variables

Go to **Settings** → **Environment Variables**

Verify ALL of these exist and are assigned to **Production, Preview, AND Development**:

#### Required Variables (Check all environments!)

- [ ] `RECIPIENT_ID`
  - Value: `ariel` (or other recipient)
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `RECIPIENT_NAME`
  - Value: `Ariel` (or other name)
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `ACCESS_CODE`
  - Value: (your access code)
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `ADMIN_PASSWORD`
  - Value: (your admin password)
  - Environments: ✅ Production ✅ Preview ✅ Development

#### Auto-Injected by Storage (Should exist automatically)

- [ ] `POSTGRES_URL`
  - Status: Auto-injected by Vercel Storage
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `BLOB_READ_WRITE_TOKEN`
  - Status: Auto-injected by Vercel Storage
  - Environments: ✅ Production ✅ Preview ✅ Development

#### Optional (for Cloud Print)

- [ ] `CLOUD_PRINT_SERVICE_URL`
- [ ] `CLOUD_PRINT_API_KEY`
- [ ] `CLOUD_PRINT_API_SECRET`

### 3. Verify Storage Connection to Project

**For Postgres:**
1. Go to **Vercel Dashboard** → **Storage** (top nav)
2. Click on your Postgres database
3. Check **Connected Projects** section
4. Your project should be listed
5. Click **Edit** next to your project
6. Verify: ✅ Production ✅ Preview ✅ Development are ALL checked

**For Blob:**
1. Same steps as above for Blob storage
2. Verify all environments are checked

### 4. Redeploy After Configuration

After connecting storage or updating environment variables:

- [ ] Trigger a new deployment
  - Option 1: Push a commit to your branch
  - Option 2: Vercel Dashboard → Deployments → Click latest → Redeploy

### 5. Test the Deployment

Once deployed:

- [ ] Health check works: `curl https://your-url.vercel.app/api/health`
- [ ] Note submission works: Submit a test note
- [ ] No errors in Vercel Function logs

---

## Common Issues & Solutions

### Issue: "Database connection error"

**Check:**
1. Storage tab shows Postgres connected?
2. Click Postgres → Connected Projects → Your project is listed?
3. Environment Variables → `POSTGRES_URL` exists for all environments?
4. Did you redeploy after connecting storage?

**Fix:**
1. Go to Storage → Postgres → Click **Connect Project**
2. Select your project
3. Check ALL environments (Production, Preview, Development)
4. Click Connect
5. Redeploy

### Issue: `POSTGRES_URL` shows only "Production"

**Fix:**
1. Storage → Postgres → Find your project in Connected Projects
2. Click **Edit**
3. Check: ✅ Preview ✅ Development
4. Save
5. Redeploy

### Issue: Health endpoint returns HTML

**Possible causes:**
1. Route not deployed yet → Redeploy
2. Using wrong URL → Double-check URL
3. Endpoint error → Check Function logs in Vercel

---

## Quick Diagnostic Commands

### Test Health Endpoint
```bash
# Basic check
curl https://your-deployment-url.vercel.app/api/health

# With admin password
curl -H "x-admin-password: YourAdminPassword" \
     https://your-deployment-url.vercel.app/api/health
```

### Test Note Submission (from browser console)
```javascript
fetch('/api/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test',
    message: 'Test message',
    accessCode: 'your-access-code',
    images: []
  })
}).then(r => r.json()).then(console.log);
```

---

## Verification Complete ✅

Once all items are checked for both projects:
- Both should work identically
- Both should be able to submit notes
- Both should have separate recipient data (isolated by `RECIPIENT_ID`)
