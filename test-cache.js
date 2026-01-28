const { cacheService } = require('./src/services/cacheService');

async function testCache() {
  try {
    console.log('\n🧪 TESTING REDIS CACHE...\n');
    
    // Test 1: Set simple data
    console.log('1️⃣ Setting simple cache data...');
    await cacheService.set('test:simple', { message: 'Hello Redis!' }, 60);
    console.log('✅ Set: test:simple\n');
    
    // Test 2: Set profile data
    console.log('2️⃣ Setting profile cache data...');
    const profileData = {
      profile_id: 999,
      user_id: 1,
      business_name: 'Test Business',
      tagline: 'Testing Redis Cache',
      created_at: new Date()
    };
    await cacheService.set('profile:999', profileData, 300);
    console.log('✅ Set: profile:999\n');
    
    // Test 3: Set menu data
    console.log('3️⃣ Setting menu cache data...');
    const menuData = {
      categories: [
        { id: 1, name: 'Appetizers' },
        { id: 2, name: 'Main Course' }
      ],
      items: [
        { id: 1, name: 'Spring Rolls', price: 150 },
        { id: 2, name: 'Pasta', price: 350 }
      ]
    };
    await cacheService.set('menu:999:full', menuData, 3600);
    console.log('✅ Set: menu:999:full\n');
    
    // Test 4: Set analytics data
    console.log('4️⃣ Setting analytics cache data...');
    const analyticsData = {
      totalProfiles: 5,
      totalViews: 1250,
      totalLeads: 45,
      conversionRate: 3.6
    };
    await cacheService.set('analytics:dashboard:1', analyticsData, 3600);
    console.log('✅ Set: analytics:dashboard:1\n');
    
    // Test 5: Get data back
    console.log('5️⃣ Retrieving cached data...\n');
    
    const simple = await cacheService.get('test:simple');
    console.log('📦 test:simple:', simple);
    
    const profile = await cacheService.get('profile:999');
    console.log('📦 profile:999:', profile);
    
    const menu = await cacheService.get('menu:999:full');
    console.log('📦 menu:999:full:', menu);
    
    const analytics = await cacheService.get('analytics:dashboard:1');
    console.log('📦 analytics:dashboard:1:', analytics);
    
    console.log('\n✅ CACHE TEST COMPLETED!\n');
    console.log('💡 Now run: node check-redis-cache.js to see all cached data\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing cache:', error);
    process.exit(1);
  }
}

testCache();
