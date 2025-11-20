# TODO - Security & Code Quality Fixes

## 🔴 CRITICAL (Must Fix Before Production)

- [ ] **TASK 1: Implement Rate Limiting**
  - File: All auth API routes
  - Priority: CRITICAL - BLOCKS PRODUCTION
  - Effort: Medium (requires infrastructure)
  - Options: Vercel Edge Config, Redis (Upstash), Arcjet, or in-memory Map

## ⚠️ HIGH PRIORITY (Fix This Week)

- [ ] **TASK 2: Replace Regex Sanitization with DOMPurify**
  - File: `lib/markdown.ts`
  - Priority: HIGH
  - Effort: Low
  - Steps: `npm install dompurify isomorphic-dompurify @types/dompurify`

- [ ] **TASK 3: Add Fetch Timeouts**
  - Files: `lib/cloud-print.ts:52`, `hooks/use-cloud-print.ts:16`
  - Priority: HIGH
  - Effort: Low
  - Create: `fetchWithTimeout()` utility function

- [ ] **TASK 4: Remove Credentials from SessionStorage**
  - Files: `app/page.tsx:27`, `hooks/use-admin-auth.ts:59`
  - Priority: HIGH
  - Effort: Medium (architecture change)
  - Options: httpOnly cookies OR document risk

- [ ] **TASK 5: Fix Stack Trace Exposure**
  - File: `app/api/init-db/route.ts:32`
  - Priority: HIGH
  - Effort: Trivial
  - Hide stack traces in production

## 🔶 MEDIUM PRIORITY (Should Fix Soon)

- [ ] **TASK 6: Add FileReader Error Handlers**
  - File: `app/submit/page.tsx:53-61`
  - Priority: MEDIUM
  - Effort: Trivial

- [ ] **TASK 7: Validate Image URLs from Trusted Domain**
  - File: `app/api/notes/route.ts:46-52`
  - Priority: MEDIUM
  - Effort: Low
  - Whitelist: `*.vercel-storage.com`

- [ ] **TASK 8: Fix Silent Database Errors**
  - File: `lib/storage.ts:73-78`
  - Priority: MEDIUM
  - Effort: Trivial
  - Re-throw errors instead of returning empty array

- [ ] **TASK 9: Add SVG Element Removal**
  - File: `lib/markdown.ts`
  - Priority: MEDIUM (covered by TASK 2)
  - Effort: Trivial

- [ ] **TASK 10: Image Fetch Timeout in Cloud Print**
  - File: `lib/cloud-print.ts:52`
  - Priority: MEDIUM
  - Effort: Trivial (uses TASK 3)

- [ ] **TASK 11: Cloud Print Error Handling**
  - File: `hooks/use-cloud-print.ts:35`
  - Priority: MEDIUM
  - Effort: Trivial

## 📝 LOW PRIORITY (Nice to Have)

- [ ] **TASK 12: File Magic Number Validation**
  - File: `app/api/upload-image/route.ts`
  - Check actual file bytes, not just MIME type

- [ ] **TASK 13: Debug Endpoint Review**
  - Ensure no info leakage in production

- [ ] **TASK 14: Fix Promise in useEffect**
  - File: `hooks/use-admin-auth.ts:42`
  - Properly await fetchNotes()

- [ ] **TASK 15: Optimize Regex Patterns**
  - File: `lib/markdown.ts:67-86`
  - Combine duplicate patterns

- [ ] **TASK 16: Markdown DoS Protection**
  - Add parsing timeout for complex markdown

- [ ] **TASK 17: Name Input Validation**
  - File: `app/api/notes/route.ts:61`
  - Validate allowed characters in names

- [ ] **TASK 18-24: Add Test Coverage**
  - Authentication tests
  - XSS payload tests
  - File upload tests
  - Database operation tests
  - Rate limiting tests (after TASK 1)

---

## ✅ COMPLETED (20 fixes)

### Pass 1 (13 fixed)
- [x] Remove hardcoded default credentials
- [x] Fix XSS in markdown alt text
- [x] Improve HTML sanitization
- [x] Add JSON.parse error handling
- [x] Fix unsafe file extension handling
- [x] Replace deprecated substr()
- [x] Extract admin auth to custom hook
- [x] Type all catch blocks (15 locations)
- [x] Remove typeof window checks
- [x] Replace require() with ES import
- [x] Remove unused logger exports
- [x] Remove unused @vercel/postgres dependency
- [x] Update Tailwind config

### Pass 2 (7 fixed)
- [x] Add timing-safe password comparison
- [x] Add credential length validation
- [x] Fix error detail leakage
- [x] Fix database race condition
- [x] Fix timestamp validation
- [x] (typeof window checks - covered above)

---

## 📊 PROGRESS TRACKER

- **Total Tasks:** 24 remaining
- **Blocking Production:** 5 tasks (1 critical + 4 high)
- **Estimated Time:**
  - Critical: ~4 hours (rate limiting setup)
  - High Priority: ~3 hours
  - Medium Priority: ~2 hours
  - Low Priority: ~8 hours (mostly testing)

---

**See SECURITY_REVIEW.md for detailed implementation guides**
