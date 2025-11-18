# API Documentation

Base URL: `http://localhost:4000/api` (development)

## Authentication

All authenticated endpoints require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /api/auth/login
Authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": { ... },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /api/auth/logout
Invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

### GET /api/auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "displayName": "John Doe",
  "bio": "Creator bio",
  "avatarUrl": "https://...",
  "emailVerified": true
}
```

---

## Products (Seller)

### GET /api/products
List all products for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (all|published|draft)

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "uuid",
      "title": "My eBook",
      "slug": "my-ebook",
      "description": "Description",
      "priceCents": 2999,
      "currency": "USD",
      "coverImageUrl": "https://...",
      "productType": "download",
      "isPublished": true,
      "salesCount": 42,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### POST /api/products
Create a new product.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "My eBook",
  "slug": "my-ebook",
  "description": "A comprehensive guide...",
  "priceCents": 2999,
  "currency": "USD",
  "productType": "download",
  "coverImageUrl": "https://..."
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "My eBook",
  ...
}
```

### GET /api/products/:id
Get product details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "My eBook",
  "files": [
    {
      "id": "uuid",
      "fileName": "ebook.pdf",
      "fileSize": 1048576,
      "fileType": "application/pdf"
    }
  ],
  ...
}
```

### PUT /api/products/:id
Update product.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Updated Title",
  "priceCents": 3999
}
```

**Response:** `200 OK`

### DELETE /api/products/:id
Delete product.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

### POST /api/products/:id/publish
Publish/unpublish product.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "isPublished": true
}
```

**Response:** `200 OK`

### POST /api/products/:id/files
Upload file to product.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:**
```
file: <binary>
displayOrder: 0
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "fileName": "ebook.pdf",
  "fileSize": 1048576,
  "fileUrl": "https://...",
  "fileType": "application/pdf"
}
```

### DELETE /api/products/:id/files/:fileId
Delete file from product.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## Storefront (Public)

### GET /api/store/:username
Get creator's storefront.

**Response:** `200 OK`
```json
{
  "user": {
    "username": "johndoe",
    "displayName": "John Doe",
    "bio": "Creator bio",
    "avatarUrl": "https://..."
  },
  "products": [
    {
      "id": "uuid",
      "title": "My eBook",
      "slug": "my-ebook",
      "description": "Description",
      "priceCents": 2999,
      "currency": "USD",
      "coverImageUrl": "https://...",
      "salesCount": 42
    }
  ]
}
```

### GET /api/store/:username/:slug
Get product details from storefront.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "My eBook",
  "description": "Full description",
  "priceCents": 2999,
  "currency": "USD",
  "coverImageUrl": "https://...",
  "salesCount": 42,
  "creator": {
    "username": "johndoe",
    "displayName": "John Doe"
  }
}
```

---

## Checkout

### POST /api/checkout/create-session
Create Stripe checkout session.

**Request:**
```json
{
  "productId": "uuid",
  "buyerEmail": "buyer@example.com",
  "buyerName": "Jane Buyer",
  "discountCode": "LAUNCH50"
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "stripe_session_id",
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/checkout/verify-discount
Verify discount code.

**Request:**
```json
{
  "productId": "uuid",
  "code": "LAUNCH50"
}
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "discountType": "percentage",
  "discountValue": 50,
  "finalPriceCents": 1499
}
```

### GET /api/checkout/success/:orderId
Get order details after successful payment.

**Query Params:** `token=<download_token>`

**Response:** `200 OK`
```json
{
  "order": {
    "id": "uuid",
    "product": {
      "title": "My eBook"
    },
    "amountCents": 2999,
    "downloadUrl": "/api/download/<token>"
  }
}
```

---

## Orders (Seller)

### GET /api/orders
List all orders for seller.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (all|completed|refunded)
- `productId` (optional filter)

**Response:** `200 OK`
```json
{
  "orders": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "title": "My eBook"
      },
      "buyerEmail": "buyer@example.com",
      "buyerName": "Jane Buyer",
      "amountCents": 2999,
      "currency": "USD",
      "status": "completed",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### GET /api/orders/:id
Get order details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### POST /api/orders/:id/refund
Refund an order.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "refunded",
  "refundedAt": "2025-01-02T12:00:00Z"
}
```

### GET /api/orders/export
Export orders to CSV.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `startDate` (ISO date)
- `endDate` (ISO date)

**Response:** `200 OK` (CSV file)

---

## Downloads (Buyer)

### GET /api/download/:token
Download purchased files.

**Response:** Redirects to signed S3 URL or streams file

---

## Analytics (Seller)

### GET /api/analytics/overview
Get sales overview.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `period` (7d|30d|90d|all)

**Response:** `200 OK`
```json
{
  "totalRevenueCents": 99999,
  "totalSales": 42,
  "conversionRate": 12.5,
  "averageOrderValueCents": 2380
}
```

### GET /api/analytics/sales
Get sales timeline.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `period` (7d|30d|90d|year)
- `groupBy` (day|week|month)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "date": "2025-01-01",
      "salesCount": 5,
      "revenueCents": 14995
    }
  ]
}
```

### GET /api/analytics/customers
Get customer insights.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "totalCustomers": 38,
  "repeatCustomerRate": 15.8,
  "topCountries": [
    { "country": "US", "count": 20 },
    { "country": "UK", "count": 8 }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email"
      }
    ]
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

---

## Rate Limiting

- **Default:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 5 requests per 15 minutes per IP
- **Upload endpoints:** 10 requests per hour per user

Headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000
```

---

## Webhooks

### Stripe Webhooks

**Endpoint:** `POST /api/webhooks/stripe`

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

All webhook requests must include valid Stripe signature in header:
```
Stripe-Signature: t=timestamp,v1=signature
```
