# Redis Cache - Quick Start Guide ⚡

## 🎯 Redis Cache Kahan Store Hota Hai?

**Answer: RAM (Computer Memory) mein, disk pe nahi!**

---

## 🚀 3 Simple Steps to See Cache

### Step 1: Test Cache Data Create Karo
```bash
cd backend
node test-cache.js
```

Output:
```
✅ Set: test:simple
✅ Set: profile:999
✅ Set: menu:999:full
✅ Set: analytics:dashboard:1
✅ CACHE TEST COMPLETED!
```

### Step 2: Cache Data Dekho
```bash
node check-redis-cache.js
```

Output:
```
✅ Found 3 cached items:

📦 KEY: profile:999
⏰ TTL: 287 seconds (4 minutes)
📊 DATA SIZE: 134 bytes
📄 DATA PREVIEW: { profile_id: 999, business_name: "Test Business" }

📦 KEY: menu:999:full
⏰ TTL: 3343 seconds (55 minutes)
📊 DATA SIZE: 164 bytes
📄 DATA PREVIEW: { categories: [...], items: [...] }
```

### Step 3: Redis CLI Se Bhi Check Karo (Optional)
```bash
redis-cli
KEYS *
GET profile:999
exit
```

---

## 📦 Application Mein Kya Kya Cache Hota Hai?

| Module | Cache Key | TTL | Purpose |
|--------|-----------|-----|---------|
| Profile | `profile:user:{userId}` | 5 min | User ke saare profiles |
| Profile | `profile:{profileId}` | 10 min | Single profile data |
| Menu | `menu:{profileId}:full` | 1 hour | Complete menu |
| Analytics | `analytics:dashboard:{userId}` | 1 hour | Dashboard stats |

---

## 🔧 Useful Commands

```bash
# Test cache
node test-cache.js

# Check cache
node check-redis-cache.js

# Clear all cache
redis-cli FLUSHALL

# Check Redis is running
redis-cli ping
# Should return: PONG
```

---

## 💡 Key Points

1. **Location**: RAM (Memory) - Not on disk
2. **Speed**: 100x faster than database
3. **Temporary**: Auto-deletes after TTL expires
4. **Automatic**: Works automatically when you call APIs
5. **Testing**: Use provided scripts to test

---

## 📚 Full Documentation

- **English**: `REDIS_CACHE_GUIDE.md`
- **Hindi**: `REDIS_CACHE_HINDI.md`

---

## ✅ Quick Test

```bash
# 1. Start server (if not running)
node src/server.js

# 2. In another terminal, create test cache
node test-cache.js

# 3. View cache
node check-redis-cache.js

# Done! You should see cached data 🎉
```

---

**That's it! Redis cache is working and storing data in RAM! 🚀**
