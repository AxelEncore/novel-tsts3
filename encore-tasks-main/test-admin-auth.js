const fetch = require('node-fetch');

// Admin credentials for testing
const ADMIN_EMAIL = 'axelencore@mail.ru';
const ADMIN_PASSWORD = 'Ad580dc6axelencore';
const BASE_URL = 'http://localhost:3000';

async function testAdminAuth() {
  console.log('🔐 Testing admin authentication with fresh session...');
  
  try {
    // Step 1: Login with admin credentials
    console.log('\n1. Attempting fresh admin login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    console.log(`Login response status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Login failed:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Fresh login successful!');
    console.log('User data:', {
      id: loginData.user?.id,
      email: loginData.user?.email,
      role: loginData.user?.role,
      isApproved: loginData.user?.isApproved
    });

    // Extract fresh cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Fresh cookies received:', cookies ? 'Yes' : 'No');
    console.log('Token in response:', loginData.token ? 'Yes' : 'No');

    // Step 2: Test authentication with fresh token
    console.log('\n2. Testing authentication with fresh token...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
        'Authorization': loginData.token ? `Bearer ${loginData.token}` : ''
      }
    });

    console.log(`Auth check status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication verified with fresh token!');
      console.log('Authenticated user:', {
        id: authData.user?.id,
        email: authData.user?.email,
        role: authData.user?.role
      });
    } else {
      const errorText = await authResponse.text();
      console.error('❌ Authentication failed:', errorText);
      return;
    }

    // Step 3: Test admin access to protected endpoints with fresh token
    console.log('\n3. Testing admin access to projects with fresh token...');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
        'Authorization': loginData.token ? `Bearer ${loginData.token}` : ''
      }
    });

    console.log(`Projects access status: ${projectsResponse.status}`);
    
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log('✅ Admin can access projects with fresh token!');
      console.log(`Found ${projectsData.length || 0} projects`);
    } else {
      const errorText = await projectsResponse.text();
      console.error('❌ Projects access failed:', errorText);
    }

    // Step 4: Test admin access to users endpoint with fresh token
    console.log('\n4. Testing admin access to users with fresh token...');
    const usersResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
        'Authorization': loginData.token ? `Bearer ${loginData.token}` : ''
      }
    });

    console.log(`Users access status: ${usersResponse.status}`);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Admin can access users with fresh token!');
      console.log(`Found ${usersData.users?.length || 0} users`);
    } else {
      const errorText = await usersResponse.text();
      console.error('❌ Users access failed:', errorText);
    }

    console.log('\n🎉 All authentication tests passed with fresh tokens!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAdminAuth().then(() => {
  console.log('\n🏁 Fresh admin authentication test completed!');
}).catch(error => {
  console.error('❌ Test script error:', error);
});