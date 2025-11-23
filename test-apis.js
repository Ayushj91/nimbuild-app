const axios = require('axios');

const BASE_URL = 'http://13.200.224.49:8080/api';
const ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzNTc1MDljYi1jYzNkLTQxNDEtODVmZC1lYjBiZDEzZTE5ZDYiLCJpYXQiOjE3NjM4ODk0OTcsImV4cCI6MTc2Mzk3NTg5N30.heNHbTnSo3wxPacn0JEbUb52hVZFJACoVv_M31Rxxdg';

// Create axios instance with auth
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

const results = {
    success: [],
    failed: []
};

// Helper to test an endpoint
async function testEndpoint(name, method, path, data = null, description = '') {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   Endpoint: ${method} ${path}`);
    if (description) console.log(`   Description: ${description}`);

    try {
        let response;
        const config = {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        if (method === 'GET') {
            response = await apiClient.get(path, config);
        } else if (method === 'POST') {
            response = await apiClient.post(path, data, config);
        } else if (method === 'PUT') {
            response = await apiClient.put(path, data, config);
        } else if (method === 'PATCH') {
            response = await apiClient.patch(path, data, config);
        } else if (method === 'DELETE') {
            response = await apiClient.delete(path, config);
        }

        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   Response Type: ${typeof response.data}`);
        if (Array.isArray(response.data)) {
            console.log(`   Response: Array with ${response.data.length} items`);
        } else if (typeof response.data === 'object') {
            console.log(`   Response Keys: ${Object.keys(response.data).join(', ')}`);
        }

        results.success.push({
            name,
            method,
            path,
            status: response.status,
            sentData: data,
            responseType: Array.isArray(response.data) ? 'array' : typeof response.data,
            responsePreview: Array.isArray(response.data)
                ? `Array[${response.data.length}]`
                : (typeof response.data === 'object' ? Object.keys(response.data).join(', ') : String(response.data))
        });

        return response.data;
    } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.status || 'Network Error'}`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);

        results.failed.push({
            name,
            method,
            path,
            sentData: data,
            status: error.response?.status || 'Network Error',
            error: error.response?.data?.message || error.message,
            fullError: error.response?.data || error.message
        });

        return null;
    }
}

async function runTests() {
    console.log('='.repeat(80));
    console.log('API ENDPOINT TESTING');
    console.log('='.repeat(80));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Token: ${ACCESS_TOKEN.substring(0, 30)}...`);
    console.log('='.repeat(80));

    // ==================== AUTH SERVICE ====================
    console.log('\n\n📁 AUTH SERVICE');
    console.log('-'.repeat(80));

    await testEndpoint(
        'Get Current User',
        'GET',
        '/auth/me',
        null,
        'Get authenticated user details'
    );

    // ==================== USER SERVICE ====================
    console.log('\n\n📁 USER SERVICE');
    console.log('-'.repeat(80));

    await testEndpoint(
        'Get Me (User Service)',
        'GET',
        '/auth/me',
        null,
        'Alternative user endpoint'
    );

    await testEndpoint(
        'Search Users',
        'GET',
        '/users/search?query=test',
        null,
        'Search for users by query'
    );

    await testEndpoint(
        'Get Avatar Download URL',
        'GET',
        '/users/me/avatar/download',
        null,
        'Get current user avatar URL'
    );

    // ==================== PROJECT SERVICE ====================
    console.log('\n\n📁 PROJECT SERVICE');
    console.log('-'.repeat(80));

    const projects = await testEndpoint(
        'Get Projects',
        'GET',
        '/projects',
        null,
        'List all accessible projects'
    );

    // If we have projects, test project-specific endpoints
    if (projects && projects.length > 0) {
        const projectId = projects[0].id;
        console.log(`\n   Using project ID: ${projectId} for subsequent tests`);

        await testEndpoint(
            'Get Project Details',
            'GET',
            `/projects/${projectId}`,
            null,
            'Get specific project details'
        );

        await testEndpoint(
            'Get Project Members',
            'GET',
            `/projects/${projectId}/members`,
            null,
            'List project members'
        );

        // ==================== TASK SERVICE ====================
        console.log('\n\n📁 TASK SERVICE');
        console.log('-'.repeat(80));

        const tasks = await testEndpoint(
            'Get Tasks',
            'GET',
            `/projects/${projectId}/tasks`,
            null,
            'List all tasks in project'
        );

        // If we have tasks, test task-specific endpoints
        if (tasks && tasks.length > 0) {
            const taskId = tasks[0].id;
            console.log(`\n   Using task ID: ${taskId} for subsequent tests`);

            await testEndpoint(
                'Get Task Details',
                'GET',
                `/projects/${projectId}/tasks/${taskId}`,
                null,
                'Get specific task details'
            );

            await testEndpoint(
                'Get Visible Assignee',
                'GET',
                `/projects/${projectId}/tasks/${taskId}/visible-assignee`,
                null,
                'Get resolved assignee'
            );

            await testEndpoint(
                'Get Task Assignments',
                'GET',
                `/projects/${projectId}/tasks/${taskId}/assignments`,
                null,
                'Get assignment chain'
            );

            await testEndpoint(
                'Get Task Activity',
                'GET',
                `/projects/${projectId}/tasks/${taskId}/activity`,
                null,
                'Get task activity timeline'
            );

            // ==================== COMMENT SERVICE ====================
            console.log('\n\n📁 COMMENT SERVICE');
            console.log('-'.repeat(80));

            const comments = await testEndpoint(
                'Get Comments',
                'GET',
                `/projects/${projectId}/tasks/${taskId}/comments`,
                null,
                'List all comments on task'
            );

            if (comments && comments.length > 0) {
                const commentId = comments[0].id;

                await testEndpoint(
                    'Get Comment Details',
                    'GET',
                    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
                    null,
                    'Get specific comment'
                );

                await testEndpoint(
                    'Get Comment Thread',
                    'GET',
                    `/projects/${projectId}/tasks/${taskId}/comments/threads/${commentId}`,
                    null,
                    'Get comment with nested replies'
                );

                await testEndpoint(
                    'Get Comment Replies',
                    'GET',
                    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}/replies`,
                    null,
                    'Get direct replies to comment'
                );
            }
        }

        // ==================== BLUEPRINT SERVICE ====================
        console.log('\n\n📁 BLUEPRINT SERVICE');
        console.log('-'.repeat(80));

        const blueprints = await testEndpoint(
            'List Blueprints',
            'GET',
            `/projects/${projectId}/blueprints`,
            null,
            'List all blueprints in project'
        );

        if (blueprints && blueprints.blueprints && blueprints.blueprints.length > 0) {
            const blueprintId = blueprints.blueprints[0].id;
            console.log(`\n   Using blueprint ID: ${blueprintId} for subsequent tests`);

            await testEndpoint(
                'Get Blueprint Details',
                'GET',
                `/projects/${projectId}/blueprints/${blueprintId}`,
                null,
                'Get specific blueprint'
            );

            await testEndpoint(
                'Get Blueprint Download URL',
                'GET',
                `/blueprints/${blueprintId}/download`,
                null,
                'Get signed download URL'
            );

            await testEndpoint(
                'List Blueprint Markers',
                'GET',
                `/blueprints/${blueprintId}/markers`,
                null,
                'List all markers on blueprint'
            );
        }

        // ==================== GROUP SERVICE ====================
        console.log('\n\n📁 GROUP SERVICE');
        console.log('-'.repeat(80));

        const projectGroups = await testEndpoint(
            'Get Project Groups',
            'GET',
            `/projects/${projectId}/groups`,
            null,
            'List all groups in project'
        );

        if (projectGroups && projectGroups.length > 0) {
            const groupId = projectGroups[0].id;

            await testEndpoint(
                'Get Group Details',
                'GET',
                `/groups/${groupId}`,
                null,
                'Get specific group'
            );

            await testEndpoint(
                'Get Group Messages',
                'GET',
                `/groups/${groupId}/messages`,
                null,
                'List all messages in group'
            );

            await testEndpoint(
                'Get Group Assets',
                'GET',
                `/groups/${groupId}/assets`,
                null,
                'List all assets in group'
            );
        }
    }

    // ==================== FEED SERVICE ====================
    console.log('\n\n📁 FEED SERVICE');
    console.log('-'.repeat(80));

    await testEndpoint(
        'Get Assigned To Me Feed',
        'GET',
        '/feeds/assigned-to-me?limit=20',
        null,
        'Tasks assigned to current user'
    );

    await testEndpoint(
        'Get Assigned By Me Feed',
        'GET',
        '/feeds/assigned-by-me?limit=20',
        null,
        'Tasks created by current user'
    );

    await testEndpoint(
        'Get Watching Feed',
        'GET',
        '/feeds/watching?limit=20',
        null,
        'Tasks user is watching'
    );

    await testEndpoint(
        'Get Recent Feed',
        'GET',
        '/feeds/recent?limit=20',
        null,
        'Recently viewed tasks'
    );

    await testEndpoint(
        'Search Tasks Feed',
        'GET',
        '/feeds/search?q=test&limit=20',
        null,
        'Search tasks across all projects'
    );

    // ==================== NOTIFICATION SERVICE ====================
    console.log('\n\n📁 NOTIFICATION SERVICE');
    console.log('-'.repeat(80));

    await testEndpoint(
        'Get Notifications',
        'GET',
        '/notifications?page=0&size=20',
        null,
        'List notifications with pagination'
    );

    await testEndpoint(
        'Get Unread Count',
        'GET',
        '/notifications/unread-count',
        null,
        'Get count of unread notifications'
    );

    // ==================== GROUP SERVICE (USER LEVEL) ====================
    console.log('\n\n📁 GROUP SERVICE (USER LEVEL)');
    console.log('-'.repeat(80));

    const userGroups = await testEndpoint(
        'Get User Groups',
        'GET',
        '/groups/user',
        null,
        'List all groups for current user'
    );

    // Print Summary
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`📊 Total: ${results.success.length + results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\n\n❌ FAILED ENDPOINTS:');
        console.log('='.repeat(80));
        results.failed.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.name}`);
            console.log(`   Method: ${result.method}`);
            console.log(`   Path: ${result.path}`);
            console.log(`   Status: ${result.status}`);
            if (result.sentData) {
                console.log(`   Sent Data: ${JSON.stringify(result.sentData)}`);
            }
            console.log(`   Error: ${result.error}`);
            if (result.fullError && typeof result.fullError === 'object') {
                console.log(`   Full Error: ${JSON.stringify(result.fullError, null, 2)}`);
            }
        });
    }

    if (results.success.length > 0) {
        console.log('\n\n✅ SUCCESSFUL ENDPOINTS:');
        console.log('='.repeat(80));
        results.success.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.name}`);
            console.log(`   Method: ${result.method}`);
            console.log(`   Path: ${result.path}`);
            console.log(`   Status: ${result.status}`);
            if (result.sentData) {
                console.log(`   Sent Data: ${JSON.stringify(result.sentData)}`);
            }
            console.log(`   Response: ${result.responsePreview}`);
        });
    }

    // Write results to file
    const fs = require('fs');
    const reportPath = './api-test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        token: ACCESS_TOKEN.substring(0, 30) + '...',
        summary: {
            total: results.success.length + results.failed.length,
            successful: results.success.length,
            failed: results.failed.length
        },
        results
    }, null, 2));
    console.log(`\n\n📄 Detailed results saved to: ${reportPath}`);
}

runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
