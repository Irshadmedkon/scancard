const redisClient = require('./src/config/redis');

async function checkRedisCache() {
  try {
    console.log('\n🔍 CHECKING REDIS CACHE DATA...\n');
    
    // Get all keys
    const keys = await redisClient.keys('*');
    
    if (keys.length === 0) {
      console.log('❌ No cache data found in Redis\n');
      process.exit(0);
    }
    
    console.log(`✅ Found ${keys.length} cached items:\n`);
    
    // Display each key with its data
    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      const data = await redisClient.get(key);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📦 KEY: ${key}`);
      console.log(`⏰ TTL: ${ttl} seconds (${Math.floor(ttl / 60)} minutes)`);
      console.log(`📊 DATA SIZE: ${Buffer.byteLength(data, 'utf8')} bytes`);
      
      try {
        const parsed = JSON.parse(data);
        console.log(`📄 DATA PREVIEW:`);
        
        if (Array.isArray(parsed)) {
          console.log(`   Type: Array with ${parsed.length} items`);
          if (parsed.length > 0) {
            console.log(`   First item:`, JSON.stringify(parsed[0], null, 2).substring(0, 200));
          }
        } else if (typeof parsed === 'object') {
          console.log(`   Type: Object`);
          console.log(`   Keys:`, Object.keys(parsed).join(', '));
          console.log(`   Preview:`, JSON.stringify(parsed, null, 2).substring(0, 300));
        } else {
          console.log(`   Value:`, parsed);
        }
      } catch (e) {
        console.log(`   Raw data:`, data.substring(0, 200));
      }
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Show cache statistics
    const info = await redisClient.info('stats');
    console.log('📊 REDIS STATISTICS:');
    console.log(info);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking Redis cache:', error);
    process.exit(1);
  }
}

checkRedisCache();
