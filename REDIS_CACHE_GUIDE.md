# Redis Cache Guide - Taponn Backend

## 🔍 Redis Cache Storage Location

Redis stores data **IN-MEMORY** (RAM), not on disk by default. This makes it extremely fast!

### Default Redis Configuration:
- **Host**: localhost
- **Port**: 6379
- **Storage**: RAM (Memory)
- **Persistence**: Optional (can be configured to save to disk)

---

## 📦 Where Cache is Used in Application

### 1. **Profile Module** (`src/modules/profile/profile.service.js`)

#### Cache Keys:
- `profile:user:{userId}` - User's all profiles (TTL: 5 minutes)
- `profile:{profileId}` - Single profile data (TTL: 10 minutes)
- `profile:username:{username}` - Profile by username (TTL: 10 minutes)

#### Usage:
```javascript
// Get all profiles for a user
const profiles = await cacheService.get(`profile:user:${userId}`);

// Get single profile
const profile = await cacheService.get(`profile:${profileId}`);

// Get profile by username
const profile = await cacheService.get(`profile:username:${username}`);
```

---

### 2. **Menu Module** (`src/modules/menu/menu.service.js`)

#### Cache Keys:
- `menu:{profileId}:full` - Complete menu with categories and items (TTL: 1 hour)

#### Usage:
```javascript
// Get full menu (categories + items)
const menu = await cacheService.getOrSet(
  `menu:${profileId}:full`,
  async () => {
    // Fetch from database
  },
  3600 // 1 hour
);
```

---

### 3. **Analytics Module** (`src/modules/analytics/analytics.service.js`)

#### Cache Keys:
- `analytics:dashboard:{userId}` - Dashboard analytics data (TTL: 1 hour)

#### Usage:
```javascript
// Get dashboard analytics
const analytics = await cacheService.getOrSet(
  `analytics:dashboard:${userId}`,
  async () => {
    // Calculate analytics from database
  },
  3600 // 1 hour
);
```

---

## 🔧 How to View Redis Cache Data

### Method 1: Using the Check Script (Easiest)
```bash
node check-redis-cache.js
```

### Method 2: Using Redis CLI
```bash
# Connect to Redis
redis-cli

# List all keys
KEYS *

# Get specific key value
GET profile:1

# Get key TTL (time to live)
TTL profile:1

# Get all keys matching pattern
KEYS profile:*

# Count total keys
DBSIZE

# Get Redis info
INFO

# Clear all cache
FLUSHALL
```

### Method 3: Using Node.js Script
```javascript
const redisClient = require('./src/config/redis');

async function viewCache() {
  const keys = await redisClient.keys('*');
  console.log('All keys:', keys);
  
  for (const key of keys) {
    const value = await redisClient.get(key);
    console.log(`${key}:`, value);
  }
}
```

---

## 🧪 How to Test Cache (Generate Cache Data)

### Step 1: Make API Calls to Generate Cache

```bash
# 1. Login to get token
POST http://localhost:5000/api/v1/auth/login
{
  "email": "test@taponn.com",
  "password": "password123"
}

# 2. Get profiles (will cache)
GET http://localhost:5000/api/v1/profiles
Authorization: Bearer YOUR_TOKEN

# 3. Get single profile (will cache)
GET http://localhost:5000/api/v1/profiles/2
Authorization: Bearer YOUR_TOKEN

# 4. Get menu (will cache)
GET http://localhost:5000/api/v1/menu/2
Authorization: Bearer YOUR_TOKEN

# 5. Get analytics (will cache)
GET http://localhost:5000/api/v1/analytics/dashboard
Authorization: Bearer YOUR_TOKEN
```

### Step 2: Check Redis Cache
```bash
node check-redis-cache.js
```

You should see output like:
```
✅ Found 4 cached items:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 KEY: profile:user:1
⏰ TTL: 287 seconds (4 minutes)
📊 DATA SIZE: 1234 bytes
📄 DATA PREVIEW:
   Type: Array with 1 items
   First item: {
     "profile_id": 2,
     "user_id": 1,
     "business_name": "My Business"
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 KEY: profile:2
⏰ TTL: 587 seconds (9 minutes)
📊 DATA SIZE: 856 bytes
...
```

---

## 🎯 Cache Benefits

1. **Speed**: 100x faster than database queries
2. **Reduced Load**: Less database queries
3. **Better Performance**: Faster API responses
4. **Scalability**: Can handle more users

---

## 🔄 Cache Invalidation

Cache is automatically cleared when:

1. **Profile Updated**: `profile:*` keys deleted
2. **Menu Updated**: `menu:{profileId}:*` keys deleted
3. **TTL Expires**: Automatic expiry after set time

### Manual Cache Clear:
```javascript
// Clear specific key
await cacheService.del('profile:1');

// Clear pattern
await cacheService.delPattern('profile:*');

// Clear all cache
await cacheService.flushAll();
```

---

## 📊 Cache Statistics

### View Redis Memory Usage:
```bash
redis-cli INFO memory
```

### View Cache Hit Rate:
```bash
redis-cli INFO stats
```

---

## 🛠️ Redis Configuration

Location: `src/config/redis.js`

```javascript
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0
});
```

---

## 💡 Tips

1. **Cache Warm-up**: Pre-load frequently accessed data
2. **Cache Aside Pattern**: Check cache first, then database
3. **TTL Strategy**: Short TTL for frequently changing data
4. **Key Naming**: Use consistent naming convention
5. **Monitor**: Track cache hit/miss ratio

---

## 🚀 Production Recommendations

1. **Enable Redis Persistence**: Save cache to disk
2. **Use Redis Cluster**: For high availability
3. **Set Memory Limits**: Prevent memory overflow
4. **Monitor Performance**: Use Redis monitoring tools
5. **Backup Strategy**: Regular Redis backups

---

## 📝 Example: Testing Cache in Action

```bash
# Terminal 1: Start server
cd backend
node src/server.js

# Terminal 2: Make API call
curl -X GET http://localhost:5000/api/v1/profiles/2 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Terminal 3: Check cache
node check-redis-cache.js

# You should see the profile data cached!
```

---

## 🔍 Troubleshooting

### Cache Not Working?
1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Check connection: Look for "Redis connected" in server logs
3. Check TTL: Cache might have expired
4. Check keys: `redis-cli KEYS *`

### Clear All Cache:
```bash
redis-cli FLUSHALL
```

---

## 📚 Additional Resources

- Redis Documentation: https://redis.io/docs/
- Redis Commands: https://redis.io/commands/
- Node Redis Client: https://github.com/redis/node-redis

---

**Note**: Redis stores data in RAM, so all cache is lost when Redis restarts (unless persistence is enabled).
