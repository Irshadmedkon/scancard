# 🚀 TAPONN API - COMPLETE DOCUMENTATION FOR POSTMAN

## 📋 BASE URL
```
http://localhost:5000/api/v1
```

## 🔑 AUTHENTICATION
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer {your_token}
```

---

## 1️⃣ AUTHENTICATION ENDPOINTS

### 1.1 Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+923001234567"
}
```

### 1.2 Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "irabc@example.com",
  "password": "your_password"
}

Response:
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "user": { ... }
  }
}
```

### 1.3 Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

### 1.4 Logout
```
POST /auth/logout
Authorization: Bearer {token}
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

### 1.5 Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 1.6 Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "new_password": "newpassword123"
}
```

---

## 2️⃣ PROFILE ENDPOINTS

### 2.1 Get All Profiles
```
GET /profiles
Authorization: Bearer {token}
```

### 2.2 Create Profile
```
POST /profiles
Authorization: Bearer {token}
Content-Type: application/json

{
  "profile_name": "My Business",
  "username": "mybusiness",
  "bio": "Professional services",
  "company": "My Company",
  "designation": "CEO",
  "website": "https://example.com",
  "is_public": true
}
```

### 2.3 Get Profile by ID
```
GET /profiles/1
Authorization: Bearer {token}
```

### 2.4 Get Profile by Username
```
GET /profiles/username/mybusiness
```

### 2.5 Update Profile
```
PUT /profiles/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "profile_name": "Updated Business Name",
  "bio": "New bio",
  "company": "Updated Company"
}
```

### 2.6 Delete Profile
```
DELETE /profiles/1
Authorization: Bearer {token}
```

### 2.7 Upload Profile Avatar
```
POST /profiles/1/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [select image file]
```

### 2.8 Generate QR Code
```
GET /profiles/1/qr
```

### 2.9 Get Profile Analytics
```
GET /profiles/1/analytics
Authorization: Bearer {token}
```

### 2.10 Track Profile View
```
POST /profiles/1/view
```

### 2.11 Add Link to Profile
```
POST /profiles/1/links
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "LinkedIn",
  "url": "https://linkedin.com/in/username",
  "icon": "linkedin",
  "display_order": 1
}
```

### 2.12 Update Profile Link
```
PUT /profiles/1/links/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated LinkedIn",
  "url": "https://linkedin.com/in/newusername"
}
```

### 2.13 Delete Profile Link
```
DELETE /profiles/1/links/1
Authorization: Bearer {token}
```

---

## 3️⃣ LEADS ENDPOINTS

### 3.1 Get All Leads
```
GET /leads?profile_id=1&status=new&page=1&limit=20
Authorization: Bearer {token}
```

### 3.2 Create Lead
```
POST /leads
Content-Type: application/json

{
  "profile_id": 1,
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "phone": "+923001234567",
  "company": "Tech Startup",
  "message": "Interested in your services",
  "source": "website"
}
```

### 3.3 Get Lead by ID
```
GET /leads/1
Authorization: Bearer {token}
```

### 3.4 Update Lead
```
PUT /leads/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "contacted",
  "notes": "Called and discussed requirements"
}
```

### 3.5 Update Lead Status
```
PUT /leads/1/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "converted"
}
```

### 3.6 Archive Lead
```
PUT /leads/1/archive
Authorization: Bearer {token}
```

### 3.7 Delete Lead
```
DELETE /leads/1
Authorization: Bearer {token}
```

### 3.8 Export Leads to CSV
```
GET /leads/export/csv?profile_id=1&status=new&start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer {token}
```

---

## 4️⃣ MENU ENDPOINTS

**Note:** Replace `{profileId}` with your profile ID (e.g., 1)

### 4.1 Get Full Menu (Public)
```
GET /menu/1
```

### 4.2 Get Categories
```
GET /menu/1/categories
```

### 4.3 Create Category
```
POST /menu/1/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_name": "Main Course",
  "description": "Delicious main dishes",
  "display_order": 1
}
```

### 4.4 Update Category
```
PUT /menu/1/categories/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_name": "Main Course (Updated)",
  "description": "Updated description"
}
```

### 4.5 Delete Category
```
DELETE /menu/1/categories/1
Authorization: Bearer {token}
```

### 4.6 Get Menu Items by Category
```
GET /menu/1/categories/1/items
```

### 4.7 Create Menu Item
```
POST /menu/1/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_id": 1,
  "item_name": "Chicken Biryani",
  "description": "Aromatic rice with tender chicken",
  "price": 350.00,
  "is_available": true,
  "display_order": 1
}
```

### 4.8 Update Menu Item
```
PUT /menu/1/items/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "item_name": "Special Chicken Biryani",
  "price": 400.00,
  "is_available": true
}
```

### 4.9 Delete Menu Item
```
DELETE /menu/1/items/1
Authorization: Bearer {token}
```

### 4.10 Toggle Item Availability
```
PATCH /menu/1/items/1/availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_available": false
}
```

### 4.11 Upload Menu Item Image
```
POST /menu/1/items/1/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [select image file]
```

---

## 5️⃣ CATALOG ENDPOINTS

### 5.1 Get All Products
```
GET /catalog/1/products
Authorization: Bearer {token}
```

### 5.2 Create Product
```
POST /catalog/1/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_name": "Digital Business Card",
  "description": "Premium NFC business card",
  "price": 1500.00,
  "stock_quantity": 100,
  "category": "Cards",
  "sku": "DBC001"
}
```

### 5.3 Get Product by ID
```
GET /catalog/1/products/1
Authorization: Bearer {token}
```

### 5.4 Update Product
```
PUT /catalog/1/products/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_name": "Premium Digital Card",
  "price": 2000.00,
  "stock_quantity": 150
}
```

### 5.5 Delete Product
```
DELETE /catalog/1/products/1
Authorization: Bearer {token}
```

### 5.6 Upload Product Images
```
POST /catalog/1/products/1/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [select image file]
```

### 5.7 Delete Product Image
```
DELETE /catalog/1/products/1/images/1
Authorization: Bearer {token}
```

### 5.8 Update Product Stock
```
PUT /catalog/1/products/1/stock
Authorization: Bearer {token}
Content-Type: application/json

{
  "stock_quantity": 200
}
```

### 5.9 Search Catalog
```
GET /catalog/1/search?q=card&category=Cards
```

---

## 6️⃣ BOOKING ENDPOINTS

### 6.1 Get All Services
```
GET /booking/1/services
Authorization: Bearer {token}
```

### 6.2 Create Service
```
POST /booking/1/services
Authorization: Bearer {token}
Content-Type: application/json

{
  "service_name": "Business Consultation",
  "description": "1-hour consultation session",
  "duration": 60,
  "price": 5000.00
}
```

### 6.3 Update Service
```
PUT /booking/1/services/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "service_name": "Premium Consultation",
  "price": 7000.00
}
```

### 6.4 Delete Service
```
DELETE /booking/1/services/1
Authorization: Bearer {token}
```

### 6.5 Get All Bookings
```
GET /booking/1
Authorization: Bearer {token}
```

### 6.6 Create Booking
```
POST /booking/1
Content-Type: application/json

{
  "service_id": 1,
  "customer_name": "Ahmed Khan",
  "customer_email": "ahmed@example.com",
  "customer_phone": "+923001234567",
  "booking_date": "2026-02-01",
  "booking_time": "10:00:00",
  "notes": "First time customer"
}
```

### 6.7 Get Booking by ID
```
GET /booking/1/1
Authorization: Bearer {token}
```

### 6.8 Update Booking Status
```
PUT /booking/1/1/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed"
}
```

### 6.9 Check Availability
```
GET /booking/1/availability?date=2026-02-01&service_id=1
```

---

## 7️⃣ UPLOAD ENDPOINTS

### 7.1 Upload Profile Avatar
```
POST /upload/profile-avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [select image file]
profile_id: 1
```

### 7.2 Upload Menu Item Image
```
POST /upload/menu-item
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [select image file]
item_id: 1
```

### 7.3 Upload Product Image
```
POST /upload/product-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [select image file]
product_id: 1
```

### 7.4 Upload Catalog Image
```
POST /upload/catalog-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [select image file]
```

### 7.5 Delete File
```
DELETE /upload/1
Authorization: Bearer {token}
```

---

## 8️⃣ STATS ENDPOINTS

### 8.1 Get Dashboard Stats
```
GET /stats/dashboard
Authorization: Bearer {token}
```

### 8.2 Get Profile Stats
```
GET /stats/profile/1
Authorization: Bearer {token}
```

---

## 9️⃣ ANALYTICS ENDPOINTS

### 9.1 Get Profile Analytics
```
GET /analytics/profile/1
Authorization: Bearer {token}
```

### 9.2 Get Profile Views
```
GET /analytics/profile/1/views?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer {token}
```

### 9.3 Get Link Clicks
```
GET /analytics/profile/1/clicks
Authorization: Bearer {token}
```

### 9.4 Track Event
```
POST /analytics/track
Content-Type: application/json

{
  "profile_id": 1,
  "event_type": "profile_view",
  "metadata": {}
}
```

### 9.5 Export Analytics
```
GET /analytics/export/1?format=csv
Authorization: Bearer {token}
```

---

## 🔟 SEARCH ENDPOINTS

### 10.1 Search Profiles
```
GET /search/profiles?q=business&location=karachi
```

### 10.2 Global Search
```
GET /search/global?q=digital+card
```

---

## 1️⃣1️⃣ PAYMENT ENDPOINTS

### 11.1 Create Payment Order
```
POST /payment/create-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1500.00,
  "currency": "PKR",
  "description": "Digital Business Card Purchase"
}
```

### 11.2 Verify Payment
```
POST /payment/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "payment_id": "pay_123456",
  "signature": "signature_string"
}
```

### 11.3 Get Payment History
```
GET /payment/history
Authorization: Bearer {token}
```

### 11.4 Get Payment by ID
```
GET /payment/pay_123456
Authorization: Bearer {token}
```

### 11.5 Request Refund
```
POST /payment/refund/pay_123456
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Customer request"
}
```

### 11.6 Payment Webhook
```
POST /payment/webhook
Content-Type: application/json

{
  "event": "payment.success",
  "data": { ... }
}
```

---

## 1️⃣2️⃣ SUBSCRIPTION ENDPOINTS

### 12.1 Get Subscription Plans
```
GET /subscription/plans
```

### 12.2 Subscribe to Plan
```
POST /subscription/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan_id": 1,
  "payment_method": "card"
}
```

### 12.3 Get Current Subscription
```
GET /subscription/current
Authorization: Bearer {token}
```

### 12.4 Cancel Subscription
```
POST /subscription/cancel
Authorization: Bearer {token}
```

### 12.5 Upgrade Subscription
```
POST /subscription/upgrade
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_plan_id": 2
}
```

### 12.6 Renew Subscription
```
POST /subscription/renew
Authorization: Bearer {token}
```

### 12.7 Get Subscription History
```
GET /subscription/history
Authorization: Bearer {token}
```

---

## 1️⃣3️⃣ TEAM ENDPOINTS

### 13.1 Get Team Members
```
GET /teams/members
Authorization: Bearer {token}
```

### 13.2 Add Team Member
```
POST /teams/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "editor",
  "permissions": ["view", "edit"]
}
```

### 13.3 Update Team Member
```
PUT /teams/members/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}
```

### 13.4 Delete Team Member
```
DELETE /teams/members/1
Authorization: Bearer {token}
```

### 13.5 Update Member Role
```
PUT /teams/members/1/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "viewer"
}
```

### 13.6 Get Team Invitations
```
GET /teams/invitations
Authorization: Bearer {token}
```

---

## 1️⃣4️⃣ NOTIFICATION ENDPOINTS

### 14.1 Get Notifications
```
GET /notifications
Authorization: Bearer {token}
```

### 14.2 Mark as Read
```
PUT /notifications/1/read
Authorization: Bearer {token}
```

### 14.3 Mark All as Read
```
PUT /notifications/read-all
Authorization: Bearer {token}
```

### 14.4 Delete Notification
```
DELETE /notifications/1
Authorization: Bearer {token}
```

### 14.5 Get Notification Settings
```
GET /notifications/settings
Authorization: Bearer {token}
```

---

## 1️⃣5️⃣ WEBHOOK ENDPOINTS

### 15.1 Get Webhooks
```
GET /webhooks
Authorization: Bearer {token}
```

### 15.2 Create Webhook
```
POST /webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://example.com/webhook",
  "events": ["lead.created", "booking.confirmed"],
  "is_active": true
}
```

### 15.3 Update Webhook
```
PUT /webhooks/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://example.com/new-webhook",
  "is_active": true
}
```

### 15.4 Delete Webhook
```
DELETE /webhooks/1
Authorization: Bearer {token}
```

### 15.5 Test Webhook
```
POST /webhooks/1/test
Authorization: Bearer {token}
```

---

## 1️⃣6️⃣ API KEY ENDPOINTS

### 16.1 Get API Keys
```
GET /api-keys
Authorization: Bearer {token}
```

### 16.2 Create API Key
```
POST /api-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production API Key",
  "permissions": ["read", "write"]
}
```

### 16.3 Update API Key
```
PUT /api-keys/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated API Key",
  "is_active": true
}
```

### 16.4 Delete API Key
```
DELETE /api-keys/1
Authorization: Bearer {token}
```

### 16.5 Regenerate API Key
```
POST /api-keys/1/regenerate
Authorization: Bearer {token}
```

---

## 1️⃣7️⃣ NFC ENDPOINTS

### 17.1 Get NFC Cards
```
GET /nfc/cards
Authorization: Bearer {token}
```

### 17.2 Create NFC Card
```
POST /nfc/cards
Authorization: Bearer {token}
Content-Type: application/json

{
  "profile_id": 1,
  "card_uid": "04:A1:B2:C3:D4:E5:F6",
  "card_type": "ntag215"
}
```

### 17.3 Update NFC Card
```
PUT /nfc/cards/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_active": true
}
```

### 17.4 Delete NFC Card
```
DELETE /nfc/cards/1
Authorization: Bearer {token}
```

---

## 1️⃣8️⃣ BATCH OPERATIONS

### 18.1 Import Leads
```
POST /batch/leads/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [CSV file]
profile_id: 1
```

### 18.2 Bulk Update Leads
```
POST /batch/leads/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_ids": [1, 2, 3],
  "updates": {
    "status": "contacted"
  }
}
```

### 18.3 Bulk Delete Leads
```
POST /batch/leads/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_ids": [1, 2, 3]
}
```

---

## 1️⃣9️⃣ EXPORT ENDPOINTS

### 19.1 Export Leads CSV
```
GET /export/leads/csv?profile_id=1&status=new
Authorization: Bearer {token}
```

### 19.2 Export Leads PDF
```
GET /export/leads/pdf?profile_id=1
Authorization: Bearer {token}
```

### 19.3 Export Analytics CSV
```
GET /export/analytics/csv?profile_id=1&start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer {token}
```

### 19.4 Export Contacts vCard
```
GET /export/contacts/vcard?profile_id=1
Authorization: Bearer {token}
```

---

## 2️⃣0️⃣ HEALTH CHECK

### 20.1 Health Check
```
GET /health
```

---

## 📝 IMPORTANT NOTES

### URL Patterns:
1. **With profileId in URL:** `/menu/{profileId}/...`, `/catalog/{profileId}/...`, `/booking/{profileId}/...`
2. **With query param:** `/leads?profile_id=1`
3. **With path param:** `/profiles/1`, `/stats/profile/1`

### Authentication:
- Login first to get JWT token
- Add token to Authorization header: `Bearer {token}`
- Token expires after 24 hours

### Your Credentials:
```
Email: irabc@example.com
Password: your_password
Profile ID: 1
```

### Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

## 🎉 TOTAL ENDPOINTS: 133+

**Bhai, ye complete documentation hai! Postman mein test karo!** 🚀

**Last Updated:** January 26, 2026
