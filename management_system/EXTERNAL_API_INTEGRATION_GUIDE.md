# External API Integration Guide

## Current Status

**❌ Not Ready for External Use**
- Services are frontend-only TypeScript functions
- No REST API endpoints
- No authentication/authorization for external access
- `tenantId` is obtained from React context (not available externally)

## What's Needed

### 1. Backend API Server

Create REST endpoints that wrap the existing service functions:

```typescript
// Example: POST /api/v1/reservations
POST /api/v1/reservations
Headers:
  Authorization: Bearer <JWT_TOKEN>
  X-Tenant-ID: <tenant-id>  // OR extract from JWT/subdomain
Body:
{
  "guestId": "guest-123",
  "roomTypeId": "room-type-456",
  "checkInDate": "2025-02-01",
  "checkOutDate": "2025-02-03",
  "adults": 2,
  "children": 1,
  "source": "website",
  "paymentMode": "credit_card"
}
```

### 2. Tenant Identification Methods

**Option A: API Key (Recommended for Landing Pages)**
```
Headers:
  X-API-Key: <hotel-api-key>
  X-Tenant-ID: <tenant-id>
```

**Option B: Subdomain-based**
```
https://hotel-name.yourdomain.com/api/reservations
→ Extract tenant from subdomain
```

**Option C: JWT Token**
```
Authorization: Bearer <JWT_TOKEN>
→ Extract tenantId from JWT payload
```

### 3. Required API Endpoints for Landing Page

#### Public Endpoints (No Auth Required)
```
GET  /api/v1/public/room-types?tenantId=<tenant-id>
     → Get available room types for booking

GET  /api/v1/public/availability
     → Check room availability for dates
     Query: ?tenantId=<id>&checkIn=<date>&checkOut=<date>&roomTypeId=<id>
```

#### Authenticated Endpoints (API Key Required)
```
POST /api/v1/reservations
     → Create reservation from landing page
     Headers: X-API-Key, X-Tenant-ID

GET  /api/v1/reservations/{id}
     → Get reservation details
     Headers: X-API-Key, X-Tenant-ID

POST /api/v1/guests
     → Create guest profile (if not exists)
     Headers: X-API-Key, X-Tenant-ID
```

### 4. CORS Configuration

```typescript
// Allow landing page domain
app.use(cors({
  origin: [
    'https://hotel-website.com',
    'https://www.hotel-website.com',
    'https://booking.hotel-website.com'
  ],
  credentials: true
}));
```

### 5. Implementation Flow

#### Landing Page → Backend API Flow

```
1. User fills booking form on landing page
   ↓
2. Landing page calls: POST /api/v1/reservations
   Headers:
     - X-API-Key: <hotel-api-key>
     - X-Tenant-ID: <tenant-id>
   Body: { guestId, roomTypeId, checkInDate, ... }
   ↓
3. Backend validates:
   - API key belongs to tenant
   - Tenant has CRS module enabled
   - Room type exists for tenant
   - Dates are valid
   ↓
4. Backend calls: reservationService.create(tenantId, data)
   ↓
5. Backend returns: { reservation, confirmationNumber }
   ↓
6. Landing page shows confirmation
```

#### Check-in Flow (Hotel Staff)

```
1. Hotel staff checks in guest via admin panel
   ↓
2. Admin panel calls: POST /api/v1/workflows/check-in
   Headers:
     - Authorization: Bearer <staff-jwt>
   Body: { reservationId, roomId }
   ↓
3. Backend calls: workflowService.performCheckIn(tenantId, ...)
   ↓
4. Workflow automatically:
   - Updates reservation status
   - Assigns room
   - Creates folio
   - Posts room charges
   ↓
5. Backend returns: { reservation, room, folio }
```

### 6. Security Considerations

1. **Rate Limiting**: Prevent abuse on public endpoints
   ```typescript
   rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   })
   ```

2. **API Key Validation**: Verify API key belongs to tenant
   ```typescript
   async function validateApiKey(apiKey: string, tenantId: string) {
     const tenant = await tenantService.getById(tenantId);
     return tenant?.apiKey === apiKey && tenant?.status === 'active';
   }
   ```

3. **Input Validation**: Sanitize all inputs
   ```typescript
   // Use validation library (e.g., Zod, Joi)
   const schema = z.object({
     checkInDate: z.string().date(),
     checkOutDate: z.string().date(),
     adults: z.number().min(1).max(10)
   });
   ```

4. **Tenant Isolation**: Ensure all queries filter by tenantId
   ```typescript
   // Already implemented in services ✅
   reservationService.create(tenantId, data)
   ```

### 7. Example Backend Endpoint Implementation

```typescript
// Express.js example
app.post('/api/v1/reservations', async (req, res) => {
  try {
    // 1. Extract tenant from API key or JWT
    const tenantId = extractTenantId(req); // from header/subdomain/JWT
    
    // 2. Validate API key
    await validateApiKey(req.headers['x-api-key'], tenantId);
    
    // 3. Validate tenant has CRS enabled
    const tenant = await tenantService.getById(tenantId);
    if (!tenant.enabledModules.includes('crs')) {
      return res.status(403).json({ error: 'CRS module not enabled' });
    }
    
    // 4. Validate input
    const data = reservationSchema.parse(req.body);
    
    // 5. Create reservation using existing service
    const reservation = await reservationService.create(tenantId, data);
    
    // 6. Return response
    res.status(201).json({
      success: true,
      reservation: {
        id: reservation.id,
        confirmationNumber: reservation.confirmationNumber,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        status: reservation.status
      }
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 8. Landing Page Integration Example

```javascript
// Landing page JavaScript
async function createReservation(formData) {
  const response = await fetch('https://api.yourdomain.com/api/v1/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'hotel-api-key-here',
      'X-Tenant-ID': 'tenant-001'
    },
    body: JSON.stringify({
      guestId: formData.guestId,
      roomTypeId: formData.roomTypeId,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      adults: formData.adults,
      children: formData.children || 0,
      source: 'website',
      paymentMode: 'credit_card'
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    showConfirmation(data.reservation.confirmationNumber);
  } else {
    const error = await response.json();
    showError(error.message);
  }
}
```

## Summary

**Current State**: ❌ Services are frontend-only, not accessible externally

**To Enable Landing Page Integration**:
1. ✅ Service logic is ready (tenant isolation implemented)
2. ❌ Need backend API server (Express.js, Fastify, etc.)
3. ❌ Need REST endpoints wrapping services
4. ❌ Need API key/authentication system
5. ❌ Need CORS configuration
6. ❌ Need rate limiting and security

**The good news**: All the business logic, tenant isolation, and workflow services are already implemented correctly. You just need to wrap them in REST API endpoints!

