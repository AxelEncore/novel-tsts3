const fetch = require('node-fetch');
const { format } = require('date-fns');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUser = {
  email: 'axelencore@mail.ru',
  password: 'Ad580dc6axelencore'
};

const testTask = {
  title: 'Test Task with Deadline',
  description: 'This is a test task created to verify the task creation functionality with deadline field',
  priority: 'medium',
  status: 'todo',
  due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 7 days from now
  estimated_hours: 4.5,
  tags: ['test', 'api-verification'],
  assignee_ids: []
};

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  // Add authentication token if available
  if (authToken) {
    defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    console.log(`Making ${requestOptions.method || 'GET'} request to: ${url}`);
    const response = await fetch(url, requestOptions);
    const data = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      parsedData = data;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: parsedData,
      headers: response.headers
    };
  } catch (error) {
    console.error(`Request failed:`, error.message);
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Authentication token
let authToken = null;

// Test functions
async function testLogin() {
  console.log('\n=== Testing Login ===');
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });
  
  if (result.ok && result.data.token) {
    console.log('✅ Login successful');
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ Login failed:', result.status, result.data);
    return false;
  }
}

async function testServerConnection() {
  console.log('\n=== Testing Server Connection ===');
  const result = await makeRequest('/test');
  
  if (result.ok) {
    console.log('✅ Server is responding');
    return true;
  } else {
    console.log('❌ Server connection failed:', result.status, result.error || result.data);
    return false;
  }
}

async function testProjectsEndpoint() {
  console.log('\n=== Testing Projects Endpoint ===');
  const result = await makeRequest('/projects');
  
  if (result.ok) {
    console.log('✅ Projects endpoint is working');
    console.log('Projects data:', JSON.stringify(result.data, null, 2));
    return result.data;
  } else {
    console.log('❌ Projects endpoint failed:', result.status, result.data);
    return null;
  }
}

async function testBoardsEndpoint(projectId) {
  console.log('\n=== Testing Boards Endpoint ===');
  const result = await makeRequest(`/boards?project_id=${projectId}`);
  
  if (result.ok) {
    console.log('✅ Boards endpoint is working');
    console.log('Boards data:', JSON.stringify(result.data, null, 2));
    return result.data;
  } else {
    console.log('❌ Boards endpoint failed:', result.status, result.data);
    return null;
  }
}

async function testColumnsEndpoint(boardId) {
  console.log('\n=== Testing Columns Endpoint ===');
  const result = await makeRequest(`/columns?board_id=${boardId}`);
  
  if (result.ok) {
    console.log('✅ Columns endpoint is working');
    console.log('Columns data:', JSON.stringify(result.data, null, 2));
    return result.data;
  } else {
    console.log('❌ Columns endpoint failed:', result.status, result.data);
    return null;
  }
}

async function testTaskCreation(projectId, boardId, columnId) {
  console.log('\n=== Testing Task Creation ===');
  
  const taskData = {
    ...testTask,
    project_id: projectId,
    board_id: boardId,
    column_id: columnId
  };
  
  console.log('Task data to be created:', JSON.stringify(taskData, null, 2));
  
  const result = await makeRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
  
  if (result.ok) {
    console.log('✅ Task creation successful');
    console.log('Created task:', JSON.stringify(result.data, null, 2));
    return result.data;
  } else {
    console.log('❌ Task creation failed:', result.status, result.data);
    return null;
  }
}

async function testTaskRetrieval(taskId) {
  console.log('\n=== Testing Task Retrieval ===');
  const result = await makeRequest(`/tasks/${taskId}`);
  
  if (result.ok) {
    console.log('✅ Task retrieval successful');
    console.log('Retrieved task:', JSON.stringify(result.data, null, 2));
    
    // Verify deadline field
    if (result.data.due_date) {
      console.log('✅ Deadline field is present:', result.data.due_date);
    } else {
      console.log('⚠️ Deadline field is missing or null');
    }
    
    return result.data;
  } else {
    console.log('❌ Task retrieval failed:', result.status, result.data);
    return null;
  }
}

async function testTasksListEndpoint() {
  console.log('\n=== Testing Tasks List Endpoint ===');
  const result = await makeRequest('/tasks');
  
  if (result.ok) {
    console.log('✅ Tasks list endpoint is working');
    console.log(`Found ${result.data.tasks ? result.data.tasks.length : 'unknown'} tasks`);
    return result.data;
  } else {
    console.log('❌ Tasks list endpoint failed:', result.status, result.data);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Task Creation API Tests');
  console.log('=====================================');
  
  try {
    // Test server connection
    const serverOk = await testServerConnection();
    if (!serverOk) {
      console.log('\n❌ Cannot proceed - server is not responding');
      return;
    }
    
    // Test login
    const loginOk = await testLogin();
    if (!loginOk) {
      console.log('\n❌ Cannot proceed - login failed');
      return;
    }
    
    // Test projects endpoint
    const projects = await testProjectsEndpoint();
    if (!projects || !projects.data || !projects.data.projects || projects.data.projects.length === 0) {
      console.log('\n❌ Cannot proceed - no projects available');
      return;
    }
    
    const firstProject = projects.data.projects[0];
    console.log(`\nUsing project: ${firstProject.name} (ID: ${firstProject.id})`);
    
    // Test boards endpoint
    const boards = await testBoardsEndpoint(firstProject.id);
    if (!boards || !boards.data || !boards.data.boards || boards.data.boards.length === 0) {
      console.log('\n❌ Cannot proceed - no boards available');
      return;
    }
    
    const firstBoard = boards.data.boards[0];
    console.log(`Using board: ${firstBoard.name} (ID: ${firstBoard.id})`);
    
    // Test columns endpoint
    const columns = await testColumnsEndpoint(firstBoard.id);
    if (!columns || !columns.columns || columns.columns.length === 0) {
      console.log('\n❌ Cannot proceed - no columns available');
      return;
    }
    
    const firstColumn = columns.columns[0];
    console.log(`Using column: ${firstColumn.name} (ID: ${firstColumn.id})`);
    
    // Test task creation
    const createdTask = await testTaskCreation(firstProject.id, firstBoard.id, firstColumn.id);
    if (!createdTask) {
      console.log('\n❌ Task creation failed');
      return;
    }
    
    // Test task retrieval
    await testTaskRetrieval(createdTask.id);
    
    // Test tasks list
    await testTasksListEndpoint();
    
    console.log('\n🎉 All tests completed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testServerConnection,
  testTaskCreation,
  testTaskRetrieval
};