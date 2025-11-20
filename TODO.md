# TODO - Security & Code Quality Fixes

## 🔴 CRITICAL (Must Fix Before Production)

- [ ] **TASK 1: Implement Rate Limiting**
  - File: All auth API routes
  - Priority: CRITICAL - BLOCKS PRODUCTION
  - Effort: Medium (requires infrastructure)
  - Options: Vercel Edge Config, Redis (Upstash), Arcjet, or in-memory Map

## ⚠️ HIGH PRIORITY (Fix This Week)

- [ ] **TASK 4: Remove Credentials from SessionStorage**
  - Files: `app/page.tsx:27`, `hooks/use-admin-auth.ts:59`
  - Priority: HIGH
  - Effort: Medium (architecture change)
  - Options: httpOnly cookies OR document risk

## 🔶 MEDIUM PRIORITY (Should Fix Soon)

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

- [x] **TASK 9: Add SVG Element Removal** ✅ COVERED BY OPTION B
  - Fixed by DOMPurify integration (blocks all SVG by default)

- [x] **TASK 10: Image Fetch Timeout in Cloud Print** ✅ COVERED BY OPTION B
  - Fixed by fetchWithTimeout implementation (10s timeout)

- [x] **TASK 11: Cloud Print Error Handling** ✅ COVERED BY OPTION B
  - Fixed by improved error handling in hooks/use-cloud-print.ts

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

## ✅ COMPLETED (24 fixes)

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

### Option B - Quick Wins (4 fixed)
- [x] **TASK 2:** Replace regex sanitization with DOMPurify
- [x] **TASK 3:** Add fetch timeouts (created lib/fetch-utils.ts)
- [x] **TASK 5:** Fix stack trace exposure in production
- [x] **TASK 6:** Add FileReader error handlers
- [x] **TASK 9-11:** Covered by above fixes (SVG removal, cloud print timeouts, error handling)

---

## 📊 PROGRESS TRACKER

- **Total Issues Found:** 44
- **Issues Fixed:** 24 (54.5% complete) ✅
- **Issues Remaining:** 20 (45.5%)
- **Blocking Production:** 2 tasks (1 critical + 1 high)
- **Estimated Remaining Time:**
  - Critical: ~4 hours (rate limiting setup)
  - High Priority: ~2 hours (sessionStorage architectural change)
  - Medium Priority: ~1.5 hours (3 tasks, tasks 9-11 now resolved)
  - Low Priority: ~8 hours (mostly testing)

---

**See SECURITY_REVIEW.md for detailed implementation guides**
