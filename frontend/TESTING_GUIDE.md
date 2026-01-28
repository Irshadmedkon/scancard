# 🧪 TAPONN Admin Panel - Testing Guide

## 📋 Complete Testing Flow

### Step 1: Authentication ✅

#### 1.1 Register New User
1. Open `admin.html`
2. Click "🔐 Auth" in sidebar
3. Stay on "Register" tab
4. Fill form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Phone: `+923001234567` (optional)
   - Password: `password123`
5. Click "Register"
6. ✅ Success: "Registration successful!"

#### 1.2 Login
1. Click "Login" tab
2. Fill form:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Login"
4. ✅ Success: Token stored, user logged in
5. ✅ Check: Token visible in top bar

---

### Step 2: Profile Management ✅

#### 2.1 Create Profile
1. Click "👤 Profile" in sidebar
2. Stay on "Create Profile" tab
3. Fill form:
   - Profile Name: `My Business` *
   - Username: `mybusiness`
   - Company: `Tech Corp`
   - Designation: `CEO`
   - Bio: `Digital business card for my company`
   - Website: `https://example.com`
   - Public Profile: `Yes`
4. Click "Create Profile"
5. ✅ Success: Profile created
6. **📝 IMPORTANT: Note the Profile ID from response!**
   - Example: `"profile_id": 5`
   - You'll need this ID for other modules

#### 2.2 Get Profile
1. Click "Get Profile" tab
2. Enter Profile ID: `5` (use your ID)
3. Click "Get Profile"
4. ✅ Success: Profile details shown

#### 2.3 Update Profile
1. Click "Update Profile" tab
2. Fill form:
   - Profile ID: `5` (your ID)
   - Profile Name: `Updated Business`
   - Company: `New Tech Corp`
3. Click "Update Profile"
4. ✅ Success: Profile updated

#### 2.4 Delete Profile
1. Click "Delete Profile" tab
2. Enter Profile ID: `5` (your ID)
3. Click "Delete Profile"
4. Confirm deletion
5. ✅ Success: Profile deleted

**⚠️ Common Error:**
- Error: `Profile not found`
- Reason: Profile ID doesn't exist
- Solution: Create profile first, use correct ID

---

### Step 3: Menu Management ✅

#### 3.1 Create Category First
**Note:** You need to create a category via API or database first.

**Quick SQL:**
```sql
INSERT INTO menu_categories (profile_id, category_name, created_at, updated_at) 
VALUES (5, 'Main Course', NOW(), NOW());
```

Or use Postman:
```
POST /api/v1/menu/5/categories
{
  "category_name": "Main Course",
  "description": "Our main dishes"
}
```

#### 3.2 Add Menu Item
1. Click "🍔 Menu" in sidebar
2. Click "Add Menu Item" tab
3. Fill form:
   - Profile ID: `5`
   - Category ID: `1` (from step 3.1)
   - Item Name: `Burger`
   - Price: `299`
   - Description: `Delicious burger`
   - Discount Price: `249`
   - Preparation Time: `15`
   - Calories: `500`
   - Type: `Non-Veg`
   - Tags: `popular, spicy`
4. Click "Add Menu Item"
5. ✅ Success: Menu item added

---

### Step 4: Catalog Management ✅

#### 4.1 Add Product
1. Click "🛍️ Catalog" in sidebar
2. Fill form:
   - Profile ID: `5`
   - Product Name: `Digital Business Card`
   - SKU: `DBC-001`
   - Price: `1500`
   - Description: `Premium digital card`
   - Discount Price: `1200`
   - Stock Quantity: `100`
   - Category: `Cards`
   - Brand: `TAPONN`
3. Click "Add Product"
4. ✅ Success: Product added

#### 4.2 Get Products
1. Scroll down to "Get Products"
2. Enter Profile ID: `5`
3. Click "Get Products"
4. ✅ Success: All products listed

---

### Step 5: Booking Management ✅

#### 5.1 Create Service
1. Click "📅 Booking" in sidebar
2. Fill "Create Booking Service" form:
   - Profile ID: `5`
   - Service Name: `Consultation`
   - Duration: `60` (minutes)
   - Price: `2000`
   - Description: `Business consultation`
   - Buffer Time: `15`
3. Click "Create Service"
4. ✅ Success: Service created
5. **📝 Note the Service ID**

#### 5.2 Create Booking
1. Scroll to "Create Booking"
2. Fill form:
   - Profile ID: `5`
   - Service ID: `1` (from step 5.1)
   - Customer Name: `John Doe`
   - Customer Phone: `+923001234567`
   - Customer Email: `john@example.com`
   - Booking Date: `2026-02-01`
   - Booking Time: `14:00`
   - Notes: `First consultation`
3. Click "Create Booking"
4. ✅ Success: Booking created

---

### Step 6: Lead Management ✅

#### 6.1 Add Lead
1. Click "📋 Leads" in sidebar
2. Fill form:
   - Profile ID: `5`
   - Name: `Jane Smith`
   - Email: `jane@example.com`
   - Phone: `+923009876543`
   - Company: `ABC Corp`
   - Source: `website`
   - Message: `Interested in your services`
3. Click "Add Lead"
4. ✅ Success: Lead added

#### 6.2 Get Leads
1. Scroll to "Get Leads"
2. Enter Profile ID: `5`
3. Click "Get Leads"
4. ✅ Success: All leads listed

---

### Step 7: Stats & Analytics ✅

#### 7.1 Dashboard Stats
1. Click "📊 Stats" in sidebar
2. Click "Get Dashboard Stats"
3. ✅ Success: Overall stats shown

#### 7.2 Profile Stats
1. Scroll to "Profile Stats"
2. Enter Profile ID: `5`
3. Click "Get Profile Stats"
4. ✅ Success: Profile-specific stats

#### 7.3 Analytics
1. Click "📈 Analytics" in sidebar
2. Enter Profile ID: `5`
3. Click "Get Analytics"
4. ✅ Success: Analytics data shown

---

### Step 8: Search ✅

#### 8.1 Search Profiles
1. Click "🔍 Search" in sidebar
2. Fill form:
   - Query: `business`
   - Location: `karachi` (optional)
3. Click "Search"
4. ✅ Success: Matching profiles shown

---

### Step 9: Payment & Subscription ✅

#### 9.1 Create Payment Order
1. Click "💳 Payment" in sidebar
2. Fill form:
   - Amount: `1500`
   - Currency: `PKR`
   - Description: `Digital card purchase`
3. Click "Create Order"
4. ✅ Success: Payment order created

#### 9.2 Get Subscription Plans
1. Click "💎 Subscription" in sidebar
2. Click "Get Plans"
3. ✅ Success: All plans listed

---

## 🎯 Quick Testing Checklist

### Must Do First:
- [ ] Register user
- [ ] Login
- [ ] Create profile
- [ ] **Save Profile ID!**

### Then Test:
- [ ] Menu (create category first)
- [ ] Catalog
- [ ] Booking
- [ ] Leads
- [ ] Stats
- [ ] Analytics
- [ ] Search
- [ ] Payment
- [ ] Subscription

---

## ⚠️ Common Errors & Solutions

### 1. "Profile not found"
**Cause:** Profile ID doesn't exist
**Solution:** 
- Create profile first
- Use correct Profile ID
- Check response for actual ID

### 2. "Category not found"
**Cause:** Menu category doesn't exist
**Solution:**
- Create category first via API/SQL
- Use correct Category ID

### 3. "Service not found"
**Cause:** Booking service doesn't exist
**Solution:**
- Create service first
- Use correct Service ID

### 4. "Unauthorized"
**Cause:** Not logged in or token expired
**Solution:**
- Login again
- Check token in top bar

### 5. "Validation failed"
**Cause:** Missing required fields
**Solution:**
- Fill all fields marked with *
- Check field formats

---

## 💡 Pro Tips

### 1. Save IDs
Always note these IDs from responses:
- Profile ID
- Category ID
- Service ID
- Product ID
- Lead ID

### 2. Use Response Box
Check the response box after each operation:
- Look for IDs
- Check for errors
- Verify data

### 3. Test in Order
Follow this order:
1. Auth → Profile → Menu/Catalog/Booking → Leads
2. Don't skip steps
3. Create before update/delete

### 4. Check Console
Open browser console (F12):
- See API calls
- Check errors
- View debug info

### 5. Use Postman
For complex operations:
- Export token from dashboard
- Use in Postman
- Test advanced features

---

## 📊 Testing Matrix

| Module | Create | Read | Update | Delete | Status |
|--------|--------|------|--------|--------|--------|
| Auth | ✅ | ✅ | ✅ | ✅ | Working |
| Profile | ✅ | ✅ | ✅ | ✅ | Working |
| Menu | ✅ | ✅ | ✅ | ✅ | Working |
| Catalog | ✅ | ✅ | ✅ | ✅ | Working |
| Booking | ✅ | ✅ | ✅ | ✅ | Working |
| Leads | ✅ | ✅ | ✅ | ✅ | Working |
| Upload | ✅ | - | - | ✅ | Working |
| Stats | - | ✅ | - | - | Working |
| Analytics | ✅ | ✅ | - | - | Working |
| Search | - | ✅ | - | - | Working |
| Payment | ✅ | ✅ | - | - | Working |
| Subscription | ✅ | ✅ | ✅ | ✅ | Working |
| Team | ✅ | ✅ | ✅ | ✅ | Working |
| Notifications | - | ✅ | ✅ | ✅ | Working |
| Webhooks | ✅ | ✅ | ✅ | ✅ | Working |
| API Keys | ✅ | ✅ | ✅ | ✅ | Working |
| NFC | ✅ | ✅ | ✅ | ✅ | Working |
| Batch | ✅ | - | ✅ | ✅ | Working |
| Export | - | ✅ | - | - | Working |

---

## 🎉 Happy Testing!

Follow this guide step by step and you'll be able to test all 133 endpoints successfully!

**Remember:**
1. Always login first
2. Create profile and save ID
3. Use correct IDs in forms
4. Check responses
5. Have fun! 🚀
