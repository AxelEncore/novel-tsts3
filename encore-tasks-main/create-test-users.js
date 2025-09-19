const bcrypt = require('bcryptjs');
const { dbAdapter } = require('./src/lib/database-adapter');

async function createTestUsers() {
  try {
    console.log('🔄 Creating test users...');
    
    await dbAdapter.initialize();
    
    // Test users data
    const testUsers = [
      {
        email: 'manager@test.com',
        password: 'test123',
        name: 'Test Manager',
        role: 'manager'
      },
      {
        email: 'user@test.com', 
        password: 'test123',
        name: 'Test User',
        role: 'user'
      },
      {
        email: 'user2@test.com',
        password: 'test123', 
        name: 'Test User 2',
        role: 'user'
      }
    ];
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await dbAdapter.getUserByEmail(userData.email);
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await dbAdapter.createUser({
        email: userData.email,
        password_hash: hashedPassword,
        name: userData.name,
        role: userData.role,
        isApproved: true // Auto-approve for testing
      });
      
      console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.email})`);
    }
    
    console.log('\n🎉 Test users creation completed!');
    
    // Show all users
    const allUsers = await dbAdapter.getAllUsers();
    console.log('\n📊 All users in database:');
    allUsers.forEach(user => {
      const approvalStatus = user.isApproved ? '✅ Approved' : '⏳ Pending';
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - ${approvalStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await dbAdapter.close();
  }
}

createTestUsers();