# Hotel Management System - API Documentation

## Overview

This document provides comprehensive documentation for the Hotel Management System REST API. The system provides endpoints for managing hotel operations including authentication, room management, bookings, guests, billing, feedback, and gallery management.

**Base URL**: `http://localhost:8080`  
**Authentication**: JWT Bearer Token (except for login and public endpoints)  
**Content-Type**: `application/json`

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Dashboard APIs](#dashboard-apis)
3. [Room Management APIs](#room-management-apis)
4. [Booking Management APIs](#booking-management-apis)
5. [Guest Management APIs](#guest-management-apis)
6. [Bill Management APIs](#bill-management-apis)
7. [Feedback APIs](#feedback-apis)
8. [Gallery Management APIs](#gallery-management-apis)
9. [Offers APIs](#offers-apis)
10. [Error Handling](#error-handling)
11. [Security & Authorization](#security--authorization)

---

## Authentication APIs

### 1. Login

**Endpoint**: `POST /auth/login`  
**Access**: Public  
**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Validation Rules**:
- `username`: Required, 3-50 characters
- `password`: Required, minimum 6 characters

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `422 Unprocessable Entity`: Validation errors

### 2. Register User

**Endpoint**: `POST /auth/register`  
**Access**: Admin only  
**Description**: Create new user account

**Request Body**:
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "reception"
}
```

**Validation Rules**:
- `username`: Required, unique
- `password`: Required
- `role`: Required, must be "admin" or "reception"

**Response (201 Created)**:
```json
{
  "message": "User created successfully",
  "user_id": 2
}
```

---

## Dashboard APIs

### 1. Get Dashboard Statistics

**Endpoint**: `GET /dashboard/stats`  
**Access**: Admin, Reception  
**Description**: Retrieve hotel statistics and metrics

**Response (200 OK)**:
```json
{
  "totalBookings": 150,
  "checkedIn": 25,
  "pendingCheckout": 25,
  "availableRooms": 45,
  "occupiedRooms": 25,
  "unavailableRooms": 10
}
```

---

## Room Management APIs

### 1. Get All Rooms

**Endpoint**: `GET /rooms`  
**Access**: Public  
**Description**: Retrieve all rooms with their details

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "roomNumber": "101",
    "roomType": {
      "id": 1,
      "name": "Standard",
      "basePrice": 2000.00,
      "capacity": 2,
      "amenities": ["WiFi", "AC", "TV"]
    },
    "status": "available",
    "floor": 1,
    "images": [],
    "createdAt": "2024-01-01T10:00:00"
  }
]
```

### 2. Update Room Status

**Endpoint**: `PUT /rooms/{roomId}/status`  
**Access**: Admin, Reception  
**Description**: Update room status

**Path Parameters**:
- `roomId`: Room ID (Long)

**Request Body**:
```json
{
  "status": "maintenance",
  "notes": "Cleaning in progress"
}
```

**Valid Status Values**:
- `available`
- `occupied`
- `reserved`
- `maintenance`
- `dirty`

**Response (200 OK)**:
```json
{
  "id": 1,
  "roomNumber": "101",
  "status": "maintenance",
  "roomType": { ... }
}
```

**Error Responses**:
- `404 Not Found`: Room not found
- `400 Bad Request`: Invalid status value

---

## Booking Management APIs

### 1. Get All Bookings

**Endpoint**: `GET /bookings`  
**Access**: Admin, Reception  
**Description**: Retrieve bookings with optional filters

**Query Parameters**:
- `status` (optional): Filter by booking status
- `date` (optional): Filter by check-in/check-out date (YYYY-MM-DD)
- `limit` (optional): Limit number of results

**Example**: `GET /bookings?status=confirmed&limit=10`

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "bookingId": "BK12345678",
    "guest": {
      "id": 1,
      "name": "John Doe",
      "phone": "+911234567890",
      "email": "john@example.com"
    },
    "room": {
      "id": 1,
      "roomNumber": "101",
      "roomType": { ... }
    },
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "actualCheckIn": null,
    "actualCheckOut": null,
    "adults": 2,
    "children": 0,
    "totalAmount": 4000.00,
    "status": "confirmed",
    "bookingSource": "website",
    "createdAt": "2024-01-01T10:00:00"
  }
]
```

### 2. Create Booking

**Endpoint**: `POST /bookings`  
**Access**: Admin, Reception  
**Description**: Create new room booking

**Request Body**:
```json
{
  "guestName": "John Doe",
  "guestPhone": "+911234567890",
  "roomTypeId": 1,
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-17",
  "adults": 2,
  "children": 0,
  "bookingSource": "website"
}
```

**Validation Rules**:
- `guestName`: Required
- `guestPhone`: Required
- `roomTypeId`: Required, must exist
- `checkInDate`: Required, cannot be in the past
- `checkOutDate`: Required, must be after check-in date
- `adults`: Default 1, minimum 1
- `children`: Default 0
- `bookingSource`: Optional, valid values: "website", "phone", "walk_in", "chatbot"

**Business Logic**:
- Automatically creates guest if phone number doesn't exist
- Finds available room of requested type
- Validates total guests don't exceed room capacity
- Calculates total amount based on nights and room price
- Sets room status to "reserved"

**Response (201 Created)**:
```json
{
  "id": 1,
  "bookingId": "BK12345678",
  "guest": { ... },
  "room": { ... },
  "totalAmount": 4000.00,
  "status": "confirmed"
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors, no available rooms, capacity exceeded
- `404 Not Found`: Room type not found

### 3. Check-in Guest

**Endpoint**: `PUT /bookings/{bookingId}/checkin`  
**Access**: Admin, Reception  
**Description**: Check-in guest for confirmed booking

**Path Parameters**:
- `bookingId`: Booking ID (Long)

**Business Logic**:
- Validates booking status is "confirmed"
- Validates check-in date is not in future
- Sets booking status to "checked_in"
- Sets actual check-in timestamp
- Updates room status to "occupied"

**Response (200 OK)**:
```json
{
  "id": 1,
  "status": "checked_in",
  "actualCheckIn": "2024-01-15T14:30:00",
  "room": {
    "status": "occupied"
  }
}
```

**Error Responses**:
- `404 Not Found`: Booking not found
- `400 Bad Request`: Invalid booking status, early check-in

### 4. Check-out Guest

**Endpoint**: `PUT /bookings/{bookingId}/checkout`  
**Access**: Admin, Reception  
**Description**: Check-out guest from checked-in booking

**Path Parameters**:
- `bookingId`: Booking ID (Long)

**Business Logic**:
- Validates booking status is "checked_in"
- Sets booking status to "checked_out"
- Sets actual check-out timestamp
- Updates room status to "dirty"

**Response (200 OK)**:
```json
{
  "id": 1,
  "status": "checked_out",
  "actualCheckOut": "2024-01-17T11:00:00",
  "room": {
    "status": "dirty"
  }
}
```

**Error Responses**:
- `404 Not Found`: Booking not found
- `400 Bad Request`: Guest not checked-in

---

## Guest Management APIs

### 1. Get All Guests

**Endpoint**: `GET /guests`  
**Access**: Admin, Reception  
**Description**: Retrieve all guest profiles

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "phone": "+911234567890",
    "email": "john@example.com",
    "idProofType": "Passport",
    "idProofNumber": "A1234567",
    "address": "123 Main St, City",
    "createdAt": "2024-01-01T10:00:00"
  }
]
```

### 2. Create Guest

**Endpoint**: `POST /guests`  
**Access**: Admin, Reception  
**Description**: Create new guest profile

**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "+911234567890",
  "email": "john@example.com",
  "idProofType": "Passport",
  "idProofNumber": "A1234567",
  "address": "123 Main St, City"
}
```

**Validation Rules**:
- `name`: Required
- `phone`: Required, must be unique
- `email`: Optional
- `idProofType`: Optional
- `idProofNumber`: Optional
- `address`: Optional

**Response (201 Created)**:
```json
{
  "id": 1,
  "name": "John Doe",
  "phone": "+911234567890",
  "createdAt": "2024-01-01T10:00:00"
}
```

**Error Responses**:
- `400 Bad Request`: Phone number already exists

---

## Bill Management APIs

### 1. Get All Bills

**Endpoint**: `GET /bills`  
**Access**: Admin, Reception  
**Description**: Retrieve all bills

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "billNumber": "BILL001",
    "roomBooking": { ... },
    "guest": { ... },
    "roomCharges": 4000.00,
    "foodCharges": 500.00,
    "otherCharges": 100.00,
    "discount": 200.00,
    "taxAmount": 400.00,
    "totalAmount": 4800.00,
    "paymentStatus": "pending",
    "paymentMethod": null,
    "items": [],
    "createdAt": "2024-01-01T10:00:00"
  }
]
```

### 2. Get Bills by Booking

**Endpoint**: `GET /bills/booking/{bookingId}`  
**Access**: Admin, Reception  
**Description**: Retrieve bills for specific booking

**Path Parameters**:
- `bookingId`: Booking ID (Long)

### 3. Get Bills by Guest

**Endpoint**: `GET /bills/guest/{guestId}`  
**Access**: Admin, Reception  
**Description**: Retrieve bills for specific guest

**Path Parameters**:
- `guestId`: Guest ID (Long)

---

## Feedback APIs

### 1. Get All Feedback

**Endpoint**: `GET /feedback`  
**Access**: Admin, Reception  
**Description**: Retrieve all guest feedback

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "guest": { ... },
    "roomBooking": { ... },
    "roomRating": 4,
    "serviceRating": 5,
    "overallRating": 4,
    "comments": "Great stay, excellent service!",
    "feedbackType": "checkout",
    "createdAt": "2024-01-01T10:00:00"
  }
]
```

### 2. Submit Feedback

**Endpoint**: `POST /feedback`  
**Access**: Admin, Reception  
**Description**: Submit guest feedback

**Request Body**:
```json
{
  "guestId": 1,
  "roomBookingId": 1,
  "roomRating": 4,
  "serviceRating": 5,
  "overallRating": 4,
  "comments": "Great stay, excellent service!"
}
```

**Validation Rules**:
- `guestId`: Required, must exist
- `roomBookingId`: Optional, must exist if provided
- `roomRating`: Optional, 1-5 scale
- `serviceRating`: Optional, 1-5 scale
- `overallRating`: Optional, 1-5 scale
- `comments`: Optional

**Response (201 Created)**:
```json
{
  "id": 1,
  "guest": { ... },
  "roomRating": 4,
  "serviceRating": 5,
  "overallRating": 4,
  "feedbackType": "checkout"
}
```

**Error Responses**:
- `404 Not Found`: Guest or booking not found
- `400 Bad Request`: Invalid rating values (must be 1-5)

---

## Gallery Management APIs

### 1. Get All Gallery Images

**Endpoint**: `GET /gallery`  
**Access**: Admin  
**Description**: Retrieve all gallery images

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "imageUrl": "https://example.com/image1.jpg",
    "description": "Hotel lobby",
    "createdAt": "2024-01-01T10:00:00"
  }
]
```

### 2. Upload Gallery Image

**Endpoint**: `POST /gallery`  
**Access**: Admin  
**Description**: Add new image to gallery

**Request Body**:
```json
{
  "imageUrl": "https://example.com/image1.jpg",
  "type": "hotel",
  "description": "Hotel lobby"
}
```

**Validation Rules**:
- `imageUrl`: Required, valid URL
- `type`: Optional
- `description`: Optional

**Response (201 Created)**:
```json
{
  "id": 1,
  "imageUrl": "https://example.com/image1.jpg",
  "description": "Hotel lobby",
  "createdAt": "2024-01-01T10:00:00"
}
```

### 3. Delete Gallery Image

**Endpoint**: `DELETE /gallery/{imageId}`  
**Access**: Admin  
**Description**: Delete image from gallery

**Path Parameters**:
- `imageId`: Image ID (Long)

**Response (200 OK)**:
```json
{
  "message": "Image deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Image not found

---

## Offers APIs

### 1. Get Active Offers

**Endpoint**: `GET /offers`  
**Access**: Admin  
**Description**: Retrieve active offers

**Response (200 OK)**:
```json
[]
```

### 2. Create Offer

**Endpoint**: `POST /offers`  
**Access**: Admin  
**Description**: Create new offer

**Request Body**:
```json
{
  "title": "Weekend Special",
  "description": "20% off on weekend stays",
  "discount": 20
}
```

**Response (200 OK)**:
```json
{
  "title": "Weekend Special",
  "description": "20% off on weekend stays",
  "discount": 20
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {
    "field": "field name"
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

### Common Error Codes

- `VALIDATION_ERROR` (422): Request validation failed
- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `BAD_REQUEST` (400): Invalid request data
- `INTERNAL_ERROR` (500): Server error

### Validation Error Example

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "guestName": "Guest name is required",
    "checkInDate": "Check-in date is required"
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

---

## Security & Authorization

### Authentication

All endpoints except `/auth/login` and `/rooms` require JWT authentication.

**Header Format**:
```
Authorization: Bearer <JWT_TOKEN>
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all endpoints |
| **Reception** | Access to operational endpoints (bookings, guests, dashboard, feedback, bills) |
| **Public** | Login and view rooms only |

### Endpoint Access Matrix

| Endpoint | Public | Reception | Admin |
|----------|--------|-----------|-------|
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `POST /auth/register` | ❌ | ❌ | ✅ |
| `GET /rooms` | ✅ | ✅ | ✅ |
| `PUT /rooms/{id}/status` | ❌ | ✅ | ✅ |
| `GET /dashboard/stats` | ❌ | ✅ | ✅ |
| `/bookings/*` | ❌ | ✅ | ✅ |
| `/guests/*` | ❌ | ✅ | ✅ |
| `/bills/*` | ❌ | ✅ | ✅ |
| `/feedback/*` | ❌ | ✅ | ✅ |
| `/gallery/*` | ❌ | ❌ | ✅ |
| `/offers/*` | ❌ | ❌ | ✅ |

---

## Usage Examples

### Complete Booking Flow

1. **Login**:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

2. **Create Booking**:
```bash
curl -X POST http://localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "guestName": "John Doe",
    "guestPhone": "+911234567890",
    "roomTypeId": 1,
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "adults": 2
  }'
```

3. **Check-in**:
```bash
curl -X PUT http://localhost:8080/bookings/1/checkin \
  -H "Authorization: Bearer <TOKEN>"
```

4. **Check-out**:
```bash
curl -X PUT http://localhost:8080/bookings/1/checkout \
  -H "Authorization: Bearer <TOKEN>"
```

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

---

## Notes

- All timestamps are in ISO 8601 format
- All monetary amounts are in decimal format (e.g., 2000.00)
- Phone numbers should include country code
- JWT tokens expire after 24 hours (86400000 ms)
- Database uses PostgreSQL with auto-generated schemas
- API supports CORS for frontend integration

---

*Last Updated: December 2024*