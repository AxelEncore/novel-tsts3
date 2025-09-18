import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixqhqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNDU4NzQsImV4cCI6MjA1MTgyMTg3NH0.example';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTasksAPI() {
  console.log('🚀 Starting simple Tasks API test...');
  
  try {
    // Тест 1: GET /api/tasks
    console.log('\n1️⃣ Testing GET /api/tasks');
    const getResponse = await fetch('http://localhost:3000/api/tasks');
    console.log('Status:', getResponse.status);
    
    if (getResponse.ok) {
      const tasks = await getResponse.json();
      console.log('✅ GET /api/tasks - Success');
      console.log('Tasks count:', tasks.length);
    } else {
      console.log('❌ GET /api/tasks - Failed');
      const error = await getResponse.text();
      console.log('Error:', error);
    }
    
    // Тест 2: POST /api/tasks (без создания данных)
    console.log('\n2️⃣ Testing POST /api/tasks');
    const postResponse = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Test Description',
        column_id: 'fake-column-id',
        reporter_id: 'fake-user-id',
        priority: 'medium'
      })
    });
    
    console.log('Status:', postResponse.status);
    
    if (postResponse.ok) {
      const newTask = await postResponse.json();
      console.log('✅ POST /api/tasks - Success');
      console.log('Created task ID:', newTask.id);
    } else {
      console.log('❌ POST /api/tasks - Failed');
      const error = await postResponse.text();
      console.log('Error:', error);
    }
    
    console.log('\n🎉 Simple test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testTasksAPI();