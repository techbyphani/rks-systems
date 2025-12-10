# Complete Next.js to React Migration Plan
## Line-by-Line Migration Guide for All Pages

---

## Table of Contents
1. [Core Files](#core-files)
2. [Public Pages](#public-pages)
3. [Admin Pages](#admin-pages)
4. [Reception Pages](#reception-pages)
5. [Components](#components)

---

## Core Files

### 1. `src/pages/_app.tsx`
**Status:** Needs Migration

**Current Code:**
```typescript
Line 1: import '@/styles/globals.css'
Line 2: import type { AppProps } from 'next/app'
Line 3: import { ConfigProvider } from 'antd'
Line 4: import { Toaster } from 'react-hot-toast'
Line 5: import 'antd/dist/reset.css'
Line 6: 
Line 7: export default function App({ Component, pageProps }: AppProps) {
Line 8:   return (
Line 9:     <ConfigProvider
Line 10:       theme={{
Line 11:         token: {
Line 12:           colorPrimary: '#1890ff',
Line 13:           borderRadius: 6,
Line 14:         },
Line 15:       }}
Line 16:     >
Line 17:       <Component {...pageProps} />
Line 18:       <Toaster position="top-right" />
Line 19:     </ConfigProvider>
Line 20:   )
Line 21: }
```

**Migration Steps:**
- Line 2: DELETE `import type { AppProps } from 'next/app'`
- Line 7: CHANGE `export default function App({ Component, pageProps }: AppProps)` 
  TO `export default function App()`
- Line 17: DELETE `<Component {...pageProps} />` (routing handled by App.tsx)
- **Action:** This file should be DELETED (functionality moved to `src/App.tsx`)

---

### 2. `src/pages/_document.tsx`
**Status:** Needs Migration

**Current Code:**
```typescript
Line 1: import { Html, Head, Main, NextScript } from 'next/document'
Line 2: 
Line 3: export default function Document() {
Line 4:   return (
Line 5:     <Html lang="en">
Line 6:       <Head />
Line 7:       <body>
Line 8:         <Main />
Line 9:         <NextScript />
Line 10:       </body>
Line 11:     </Html>
Line 12:   )
Line 13: }
```

**Migration Steps:**
- **Action:** DELETE entire file (Next.js specific, not needed in React)

---

## Public Pages

### 3. `src/pages/index.tsx`
**Status:** ✅ Already Migrated (verify)

**Check:**
- ✅ No `next/head` import
- ✅ Uses `Helmet` from `react-helmet-async`
- ✅ No `next/router` usage
- ✅ Uses React Router if needed

---

### 4. `src/pages/login.tsx`
**Status:** ✅ Already Migrated (verify)

**Check:**
- ✅ No `next/head` import
- ✅ Uses `Helmet` from `react-helmet-async`
- ✅ No `next/router` import
- ✅ Uses `useRouter` from `@/shims/router`
- ✅ `router.push()` works correctly

---

### 5. `src/pages/rooms.tsx`
**Status:** ✅ Already Migrated (verify)

**Check:**
- ✅ No `next/head` import
- ✅ Uses `Helmet` from `react-helmet-async`
- ✅ No Next.js specific code

---

### 6. `src/pages/contact.tsx`
**Status:** ✅ Already Migrated (verify)

**Check:**
- ✅ No `next/head` import
- ✅ Uses `Helmet` from `react-helmet-async`

---

### 7. `src/pages/events.tsx`
**Status:** ✅ Already Migrated (verify)

**Check:**
- ✅ No `next/head` import
- ✅ Uses `Helmet` from `react-helmet-async`

---

### 8. `src/pages/gallery.tsx`
**Status:** ✅ Already Migrated (verify)

**Check:**
- ✅ No `next/head` import
- ✅ Uses `Helmet` from `react-helmet-async`

---

### 9. `src/pages/restaurant.tsx`
**Status:** ✅ Already Migrated (verify)

**Check:**
- ✅ No `next/head` import
- ✅ Uses `Helmet` from `react-helmet-async`

---

## Admin Pages

### 10. `src/pages/admin/index.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 1: Has `import { Helmet } from 'react-helmet-async'`
- ✅ Line 4: No `import { useRouter } from 'next/router'`
- ✅ Line 4: Has `import { useRouter } from '@/shims/router'`
- ✅ All `router.push()` calls work
- ✅ All `router.query` usage replaced with `useSearchParams()`
- ✅ `<Head>` replaced with `<Helmet>`

---

### 11. `src/pages/admin/guests.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ Line 5: Has `import { useRouter } from '@/shims/router'`
- ✅ Line 79: `const { id: urlId } = router.query` → `const urlId = useSearchParams().get('id')`
- ✅ All `router.push()` calls work
- ✅ `<Head>` replaced with `<Helmet>`

---

### 12. `src/pages/admin/bookings.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ Line 5: Has `import { useRouter } from '@/shims/router'`
- ✅ All `router.query` usage replaced
- ✅ All `router.push()` calls work
- ✅ `<Head>` replaced with `<Helmet>`

---

### 13. `src/pages/admin/bills.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 14. `src/pages/admin/feedback.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ Line 49: `const { status: urlStatus, id: urlId, guestId: urlGuestId } = router.query`
  → Replace with `useSearchParams()`
- ✅ All router usage migrated

---

### 15. `src/pages/admin/rooms.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 16. `src/pages/admin/users.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ Line 56: `const { id: urlId } = router.query` → Replace with `useSearchParams()`
- ✅ All router usage migrated

---

### 17. `src/pages/admin/offers.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 18. `src/pages/admin/pricing.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 19. `src/pages/admin/gallery.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ Line 89: `const { id: urlId } = router.query` → Replace with `useSearchParams()`
- ✅ All router usage migrated

---

### 20. `src/pages/admin/analytics.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 5: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated
- ✅ Check for `router.query` usage and replace

---

## Reception Pages

### 21. `src/pages/reception/index.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 3: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 22. `src/pages/reception/bookings.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 4: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 23. `src/pages/reception/checkin.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 4: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 24. `src/pages/reception/checkout.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 4: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 25. `src/pages/reception/guests.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 4: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 26. `src/pages/reception/rooms.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ All router usage migrated

---

### 27. `src/pages/reception/bills.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 4: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

### 28. `src/pages/reception/feedback.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Head from 'next/head'`
- ✅ Line 4: No `import { useRouter } from 'next/router'`
- ✅ All router usage migrated

---

## Components

### 29. `src/components/layout/Header.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Link from 'next/link'`
- ✅ Line 1: Has `import { Link } from 'react-router-dom'`
- ✅ All `<Link href="...">` → `<Link to="...">`
- ✅ All menu items use React Router Link

---

### 30. `src/components/layout/Footer.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import Link from 'next/link'`
- ✅ Line 1: Has `import { Link } from 'react-router-dom'`
- ✅ All `<Link href="...">` → `<Link to="...">`

---

### 31. `src/components/Breadcrumb.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import { useRouter } from 'next/router'`
- ✅ Line 1: Has `import { useRouter } from '@/shims/router'`
- ✅ All router usage migrated

---

### 32. `src/components/layout/AdminLayout.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 2: No `import { useRouter } from 'next/router'`
- ✅ Line 2: Has `import { useRouter } from '@/shims/router'`
- ✅ All router usage migrated

---

### 33. `src/components/layout/AdminSidebar.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import { useRouter } from 'next/router'`
- ✅ Line 1: Has `import { useRouter } from '@/shims/router'`
- ✅ All router usage migrated

---

### 34. `src/components/layout/ReceptionLayout.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 2: No `import { useRouter } from 'next/router'`
- ✅ Line 2: Has `import { useRouter } from '@/shims/router'`
- ✅ All router usage migrated

---

### 35. `src/components/layout/ReceptionSidebar.tsx`
**Status:** ✅ Already Migrated (verify)

**Migration Checklist:**
- ✅ Line 1: No `import { useRouter } from 'next/router'`
- ✅ Line 1: Has `import { useRouter } from '@/shims/router'`
- ✅ All router usage migrated

---

### 36. `src/components/layout/Layout.tsx`
**Status:** Needs Verification

**Check:**
- No Next.js imports
- Uses React Router if needed

---

## Common Migration Patterns

### Pattern 1: Head Component
**Before:**
```typescript
import Head from 'next/head'
// ...
<Head>
  <title>Page Title</title>
</Head>
```

**After:**
```typescript
import { Helmet } from 'react-helmet-async'
// ...
<Helmet>
  <title>Page Title</title>
</Helmet>
```

### Pattern 2: useRouter Hook
**Before:**
```typescript
import { useRouter } from 'next/router'
const router = useRouter()
router.push('/path')
const { id } = router.query
```

**After:**
```typescript
import { useRouter } from '@/shims/router'
import { useSearchParams } from 'react-router-dom'
const router = useRouter()
router.push('/path')
const searchParams = useSearchParams()
const id = searchParams.get('id')
```

### Pattern 3: Link Component
**Before:**
```typescript
import Link from 'next/link'
<Link href="/path">Text</Link>
```

**After:**
```typescript
import { Link } from 'react-router-dom'
<Link to="/path">Text</Link>
```

### Pattern 4: Image Component
**Before:**
```typescript
import Image from 'next/image'
<Image src="/image.jpg" alt="..." width={100} height={100} />
```

**After:**
```typescript
import Image from '@/shims/Image'
<img src="/image.jpg" alt="..." width={100} height={100} />
// Or use regular img tag
```

---

## Verification Checklist

For each file, verify:
- [ ] No `next/head` imports
- [ ] No `next/router` imports
- [ ] No `next/link` imports
- [ ] No `next/image` imports
- [ ] No `next/document` imports
- [ ] No `next/app` imports
- [ ] All `<Head>` replaced with `<Helmet>`
- [ ] All `router.query` replaced with `useSearchParams()`
- [ ] All `<Link href>` replaced with `<Link to>`
- [ ] All `router.push()` works correctly
- [ ] All `router.replace()` works correctly
- [ ] All `router.back()` works correctly

---

## Files to Delete

1. `src/pages/_app.tsx` (functionality in `src/App.tsx`)
2. `src/pages/_document.tsx` (not needed in React)
3. Any `.backup` files

---

## Next Steps

1. Go through each file systematically
2. Apply the migration patterns
3. Test each page after migration
4. Verify build passes
5. Test routing functionality
6. Clean up unused files

