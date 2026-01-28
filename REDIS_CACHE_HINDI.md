# Redis Cache - Kahan Store Hota Hai? 🇮🇳

## 📍 Redis Cache Kahan Store Hota Hai?

**Redis cache data RAM (Memory) mein store hota hai, disk pe nahi!**

### Location Details:
- **Storage Type**: RAM (Computer ki memory)
- **Host**: localhost
- **Port**: 6379
- **Speed**: Bahut fast (100x faster than database)
- **Persistence**: By default temporary (restart pe delete ho jata hai)

---

## 🎯 Kya Kya Cache Hota Hai?

### 1. **Profile Data**
```
Key: profile:user:1
TTL: 5 minutes
Data: User ke saare profiles
```

### 2. **Menu Data**
```
Key: menu:2:full
TTL: 1 hour
Data: Complete menu with categories aur items
```

### 3. **Analytics Data**
```
Key: analytics:dashboard:1
TTL: 1 hour
Data: Dashboard statistics
```

---

## 🔧 Cache Kaise Dekhe?

### Method 1: Script Use Karo (Sabse Easy)
```bash
cd backend
node check-redis-cache.js
```

Output:
```
✅ Found 3 cached items:

📦 KEY: profile:999
⏰ TTL: 287 seconds (4 minutes)
📊 DATA SIZE: 134 bytes
📄 DATA PREVIEW:
   {
     "profile_id": 999,
     "business_name": "Test Business"
   }
```

### Method 2: Redis CLI Use Karo
```bash
# Redis connect karo
redis-cli

# Saari keys dekho
KEYS *

# Specific key ka data dekho
GET profile:1

# Key ka TTL dekho (kitne time baad expire hoga)
TTL profile:1

# Pattern se search karo
KEYS profile:*

# Total keys count
DBSIZE

# Saara cache clear karo
FLUSHALL
```

---

## 🧪 Cache Test Kaise Kare?

### Step 1: Test Data Generate Karo
```bash
cd backend
node test-cache.js
```

Ye script automatically 4 types ka cache data create kar degi:
1. Simple test data
2. Profile data
3. Menu data
4. Analytics data

### Step 2: Cache Check Karo
```bash
node check-redis-cache.js
```

Ab tumhe saara cached data dikh jayega!

---

## 🚀 Real Application Mein Cache Kaise Hota Hai?

### Example: Profile Get Karna

```javascript
// Step 1: Pehle cache check karo
const cached = await cacheService.get('profile:2');

if (cached) {
  // Cache mein mila! Fast return
  return cached;
}

// Step 2: Cache mein nahi mila, database se fetch karo
const profile = await database.query('SELECT * FROM profiles WHERE id = 2');

// Step 3: Cache mein store karo (next time ke liye)
await cacheService.set('profile:2', profile, 600); // 10 minutes

return profile;
```

### Benefits:
- **First Request**: Database se fetch (slow - 50ms)
- **Next Requests**: Cache se fetch (fast - 1ms)
- **Result**: 50x faster! 🚀

---

## 📊 Cache Statistics Dekho

```bash
# Redis CLI mein
redis-cli INFO stats
```

Output:
```
keyspace_hits: 10      # Cache mein mila (Good!)
keyspace_misses: 2     # Cache mein nahi mila (Database se fetch kiya)
```

**Hit Rate = hits / (hits + misses) × 100**
- 80%+ = Excellent
- 60-80% = Good
- <60% = Need improvement

---

## 🔄 Cache Kab Clear Hota Hai?

### Automatic Clear:
1. **TTL Expire**: Set time ke baad auto delete
   - Profile: 5-10 minutes
   - Menu: 1 hour
   - Analytics: 1 hour

2. **Data Update**: Jab data update ho
   ```javascript
   // Profile update kiya
   await updateProfile(profileId, data);
   
   // Cache clear karo
   await cacheService.del(`profile:${profileId}`);
   ```

### Manual Clear:
```javascript
// Single key clear
await cacheService.del('profile:1');

// Pattern se clear (saare profile keys)
await cacheService.delPattern('profile:*');

// Saara cache clear
await cacheService.flushAll();
```

---

## 💡 Important Points

### 1. **RAM Mein Store Hota Hai**
- Disk pe nahi, memory mein
- Bahut fast access
- Restart pe data lost (unless persistence enabled)

### 2. **Temporary Storage**
- TTL ke baad auto delete
- Memory save karne ke liye

### 3. **Key Naming Convention**
```
module:identifier:type
Examples:
- profile:1
- profile:user:5
- menu:2:full
- analytics:dashboard:1
```

### 4. **TTL (Time To Live)**
- Kitne time tak cache rahega
- Seconds mein set hota hai
- Example: 300 = 5 minutes, 3600 = 1 hour

---

## 🛠️ Troubleshooting

### Problem: Cache nahi dikh raha?

**Solution 1**: Redis running hai check karo
```bash
redis-cli ping
# Output: PONG (agar running hai)
```

**Solution 2**: Server logs check karo
```bash
# Server start karte time ye message aana chahiye:
✅ REDIS CONNECTED SUCCESSFULLY!
```

**Solution 3**: Cache generate karo
```bash
# Test data create karo
node test-cache.js

# Phir check karo
node check-redis-cache.js
```

### Problem: Cache purana data show kar raha?

**Solution**: Cache clear karo
```bash
redis-cli FLUSHALL
```

---

## 📝 Quick Commands Reference

```bash
# Cache test karo
node test-cache.js

# Cache dekho
node check-redis-cache.js

# Redis CLI
redis-cli

# Saari keys
KEYS *

# Specific key
GET profile:1

# TTL check
TTL profile:1

# Cache clear
FLUSHALL

# Redis status
INFO

# Exit
exit
```

---

## 🎓 Summary

1. **Redis RAM mein data store karta hai** (disk pe nahi)
2. **Bahut fast hai** (100x faster than database)
3. **Temporary storage hai** (TTL ke baad delete)
4. **3 scripts hai testing ke liye**:
   - `test-cache.js` - Cache data create karo
   - `check-redis-cache.js` - Cache data dekho
   - `redis-cli` - Manual commands

4. **Cache automatically use hota hai** jab tum API call karte ho:
   - GET /profiles → Cache mein store
   - GET /menu → Cache mein store
   - GET /analytics → Cache mein store

5. **Performance boost**: First request slow, next requests fast! 🚀

---

## 🔗 Files to Check

1. `src/config/redis.js` - Redis configuration
2. `src/services/cacheService.js` - Cache functions
3. `src/modules/profile/profile.service.js` - Profile caching
4. `src/modules/menu/menu.service.js` - Menu caching
5. `src/modules/analytics/analytics.service.js` - Analytics caching

---

**Pro Tip**: Production mein Redis persistence enable karo taaki restart pe data na jaye! 💪
