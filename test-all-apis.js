const axios = require('axios');

const BASE_URL = 'http://13.200.224.49:8080/api';
const ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzNTc1MDljYi1jYzNkLTQxNDEtODVmZC1lYjBiZDEzZTE5ZDYiLCJpYXQiOjE3NjM4ODk0OTcsImV4cCI6MTc2Mzk3NTg5N30.heNHbTnSo3wxPacn0JEbUb52hVZFJACoVv_M31Rxxdg';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

const results = {
    success: [],
    failed: [],
    createdResources: {} // Track created resources for cleanup
};

async function testEndpoint(name, method, path, data = null, description = '', headers = {}) {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   Endpoint: ${method} ${path}`);
    if (description) console.log(`   Description: ${description}`);
    if (data) console.log(`   Sent Data: ${JSON.stringify(data, null, 2)}`);

    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                ...headers
            }
        };

        let response;
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
        } else if (typeof response.data === 'object' && response.data !== null) {
            const keys = Object.keys(response.data);
            console.log(`   Response Keys: ${keys.join(', ')}`);
            if (response.data.id) {
                console.log(`   Created ID: ${response.data.id}`);
            }
        }

        results.success.push({
            name,
            method,
            path,
            status: response.status,
            sentData: data,
            responseType: Array.isArray(response.data) ? 'array' : typeof response.data,
            responseData: response.data
        });

        return response.data;
    } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.status || 'Network Error'}`);
        console.log(`   Error: ${error.response?.data?.message || error.response?.data || error.message}`);

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

async function runComprehensiveTests() {
    console.log('='.repeat(80));
    console.log('COMPREHENSIVE API ENDPOINT TESTING');
    console.log('='.repeat(80));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Testing all endpoints except authentication`);
    console.log('='.repeat(80));

    // ==================== USER SERVICE ====================
    console.log('\n\n📁 USER SERVICE');
    console.log('-'.repeat(80));

    const currentUser = await testEndpoint(
        'Get Current User',
        'GET',
        '/auth/me',
        null,
        'Get authenticated user details'
    );

    await testEndpoint(
        'Search Users',
        'GET',
        '/users/search?query=test',
        null,
        'Search for users'
    );

    await testEndpoint(
        'Update User Profile',
        'PATCH',
        '/users/me',
        { companyName: 'Test Company Updated' },
        'Update current user profile'
    );

    await testEndpoint(
        'Get Avatar URL',
        'GET',
        '/users/me/avatar/download',
        null,
        'Get avatar download URL (may fail if no avatar)'
    );

    // ==================== PROJECT SERVICE ====================
    console.log('\n\n📁 PROJECT SERVICE');
    console.log('-'.repeat(80));

    const projects = await testEndpoint(
        'List Projects',
        'GET',
        '/projects',
        null,
        'Get all projects'
    );

    const newProject = await testEndpoint(
        'Create Project',
        'POST',
        '/projects',
        {
            name: `Test Project ${Date.now()}`,
            description: 'Created by comprehensive API test'
        },
        'Create a new test project'
    );

    if (newProject && newProject.id) {
        results.createdResources.projectId = newProject.id;

        await testEndpoint(
            'Get Project Details',
            'GET',
            `/projects/${newProject.id}`,
            null,
            'Get specific project details'
        );

        await testEndpoint(
            'Update Project',
            'PATCH',
            `/projects/${newProject.id}`,
            { description: 'Updated description from API test' },
            'Update project details'
        );

        await testEndpoint(
            'Get Project Members',
            'GET',
            `/projects/${newProject.id}/members`,
            null,
            'List project members'
        );

        // Use existing project for additional tests
        const existingProjectId = projects && projects.length > 0 ? projects[0].id : newProject.id;

        // ==================== TASK SERVICE ====================
        console.log('\n\n📁 TASK SERVICE');
        console.log('-'.repeat(80));

        const newTask = await testEndpoint(
            'Create Task',
            'POST',
            `/projects/${existingProjectId}/tasks`,
            {
                title: `Test Task ${Date.now()}`,
                description: 'Created by API test',
                category: 'CONSTRUCTION',
                priority: 5,
                status: 'TODO'
            },
            'Create a new task'
        );

        if (newTask && newTask.id) {
            results.createdResources.taskId = newTask.id;

            await testEndpoint(
                'Get Task Details',
                'GET',
                `/projects/${existingProjectId}/tasks/${newTask.id}`,
                null,
                'Get specific task'
            );

            await testEndpoint(
                'Update Task',
                'PATCH',
                `/projects/${existingProjectId}/tasks/${newTask.id}`,
                {
                    description: 'Updated description',
                    priority: 8
                },
                'Update task details'
            );

            await testEndpoint(
                'Update Task Status',
                'PATCH',
                `/projects/${existingProjectId}/tasks/${newTask.id}`,
                { status: 'IN_PROGRESS' },
                'Change task status'
            );

            await testEndpoint(
                'Get Task Activity',
                'GET',
                `/projects/${existingProjectId}/tasks/${newTask.id}/activity`,
                null,
                'Get task activity timeline'
            );

            await testEndpoint(
                'Get Visible Assignee',
                'GET',
                `/projects/${existingProjectId}/tasks/${newTask.id}/visible-assignee`,
                null,
                'Get resolved assignee'
            );

            await testEndpoint(
                'Get Task Assignments',
                'GET',
                `/projects/${existingProjectId}/tasks/${newTask.id}/assignments`,
                null,
                'Get assignment chain'
            );

            if (currentUser && currentUser.id) {
                await testEndpoint(
                    'Assign Task',
                    'POST',
                    `/projects/${existingProjectId}/tasks/${newTask.id}/assign`,
                    { assigneeId: currentUser.id },
                    'Assign task to user'
                );
            }

            await testEndpoint(
                'Watch Task',
                'POST',
                `/projects/${existingProjectId}/tasks/${newTask.id}/watch`,
                null,
                'Watch task for updates'
            );

            await testEndpoint(
                'Unwatch Task',
                'DELETE',
                `/projects/${existingProjectId}/tasks/${newTask.id}/watch`,
                null,
                'Unwatch task'
            );

            // ==================== COMMENT SERVICE ====================
            console.log('\n\n📁 COMMENT SERVICE');
            console.log('-'.repeat(80));

            const newComment = await testEndpoint(
                'Create Comment',
                'POST',
                `/projects/${existingProjectId}/tasks/${newTask.id}/comments`,
                { body: 'This is a test comment from API test' },
                'Add comment to task'
            );

            await testEndpoint(
                'Get Comments',
                'GET',
                `/projects/${existingProjectId}/tasks/${newTask.id}/comments`,
                null,
                'List all comments'
            );

            if (newComment && newComment.id) {
                results.createdResources.commentId = newComment.id;

                await testEndpoint(
                    'Get Comment Details',
                    'GET',
                    `/projects/${existingProjectId}/tasks/${newTask.id}/comments/${newComment.id}`,
                    null,
                    'Get specific comment'
                );

                await testEndpoint(
                    'Update Comment',
                    'PATCH',
                    `/projects/${existingProjectId}/tasks/${newTask.id}/comments/${newComment.id}`,
                    { body: 'Updated comment text' },
                    'Update comment content'
                );

                const replyComment = await testEndpoint(
                    'Create Reply Comment',
                    'POST',
                    `/projects/${existingProjectId}/tasks/${newTask.id}/comments`,
                    {
                        body: 'This is a reply to the comment',
                        replyToCommentId: newComment.id
                    },
                    'Reply to a comment'
                );

                await testEndpoint(
                    'Get Comment Thread',
                    'GET',
                    `/projects/${existingProjectId}/tasks/${newTask.id}/comments/threads/${newComment.id}`,
                    null,
                    'Get comment with nested replies'
                );

                await testEndpoint(
                    'Get Comment Replies',
                    'GET',
                    `/projects/${existingProjectId}/tasks/${newTask.id}/comments/${newComment.id}/replies`,
                    null,
                    'Get direct replies to comment'
                );

                if (replyComment && replyComment.id) {
                    await testEndpoint(
                        'Delete Reply Comment',
                        'DELETE',
                        `/projects/${existingProjectId}/tasks/${newTask.id}/comments/${replyComment.id}`,
                        null,
                        'Delete the reply comment'
                    );
                }

                await testEndpoint(
                    'Delete Comment',
                    'DELETE',
                    `/projects/${existingProjectId}/tasks/${newTask.id}/comments/${newComment.id}`,
                    null,
                    'Delete the comment'
                );
            }

            // Test task filtering
            await testEndpoint(
                'Filter Tasks',
                'POST',
                `/projects/${existingProjectId}/tasks/filter`,
                {
                    statuses: ['TODO', 'IN_PROGRESS'],
                    sortBy: 'priority',
                    sortOrder: 'DESC'
                },
                'Filter tasks with criteria'
            );
        }

        // ==================== BLUEPRINT SERVICE ====================
        console.log('\n\n📁 BLUEPRINT SERVICE');
        console.log('-'.repeat(80));

        await testEndpoint(
            'List Blueprints',
            'GET',
            `/projects/${existingProjectId}/blueprints`,
            null,
            'List all blueprints'
        );

        await testEndpoint(
            'List Blueprints with Pagination',
            'GET',
            `/projects/${existingProjectId}/blueprints?page=0&limit=10`,
            null,
            'List blueprints with pagination'
        );

        await testEndpoint(
            'Search Blueprints',
            'GET',
            `/projects/${existingProjectId}/blueprints?search=test`,
            null,
            'Search blueprints by name'
        );

        // ==================== GROUP SERVICE ====================
        console.log('\n\n📁 GROUP SERVICE');
        console.log('-'.repeat(80));

        const newGroup = await testEndpoint(
            'Create Group',
            'POST',
            '/groups',
            {
                name: `Test Group ${Date.now()}`,
                projectId: existingProjectId
            },
            'Create a new group'
        );

        await testEndpoint(
            'Get User Groups',
            'GET',
            '/groups/user',
            null,
            'List all user groups'
        );

        await testEndpoint(
            'Get Project Groups',
            'GET',
            `/projects/${existingProjectId}/groups`,
            null,
            'List project groups'
        );

        if (newGroup && newGroup.id) {
            results.createdResources.groupId = newGroup.id;

            await testEndpoint(
                'Get Group Details',
                'GET',
                `/groups/${newGroup.id}`,
                null,
                'Get specific group details'
            );

            const textMessage = await testEndpoint(
                'Send Text Message',
                'POST',
                `/groups/${newGroup.id}/messages`,
                {
                    content: 'Test message from API test',
                    messageType: 'TEXT'
                },
                'Send a text message to group'
            );

            await testEndpoint(
                'Get Group Messages',
                'GET',
                `/groups/${newGroup.id}/messages`,
                null,
                'List all messages in group'
            );

            if (textMessage && textMessage.id && currentUser && currentUser.id) {
                await testEndpoint(
                    'Send Reply Message',
                    'POST',
                    `/groups/${newGroup.id}/messages`,
                    {
                        content: 'Reply to previous message',
                        messageType: 'TEXT',
                        replyToMessageId: textMessage.id
                    },
                    'Reply to a message'
                );

                await testEndpoint(
                    'React to Message',
                    'POST',
                    `/groups/${newGroup.id}/messages/${textMessage.id}/reactions`,
                    { emoji: '👍' },
                    'Add reaction to message'
                );
            }

            await testEndpoint(
                'Get Group Assets',
                'GET',
                `/groups/${newGroup.id}/assets`,
                null,
                'List all assets in group'
            );

            if (currentUser && currentUser.id) {
                await testEndpoint(
                    'Add Group Member',
                    'POST',
                    `/groups/${newGroup.id}/members`,
                    { userId: currentUser.id },
                    'Add member to group (may fail if already member)'
                );
            }
        }
    }

    // ==================== FEED SERVICE ====================
    console.log('\n\n📁 FEED SERVICE');
    console.log('-'.repeat(80));

    await testEndpoint(
        'Assigned To Me Feed',
        'GET',
        '/feeds/assigned-to-me?limit=20',
        null,
        'Tasks assigned to me'
    );

    await testEndpoint(
        'Assigned To Me with Cursor',
        'GET',
        '/feeds/assigned-to-me?limit=5',
        null,
        'Tasks assigned to me with cursor pagination'
    );

    await testEndpoint(
        'Assigned By Me Feed',
        'GET',
        '/feeds/assigned-by-me?limit=20',
        null,
        'Tasks created by me'
    );

    await testEndpoint(
        'Watching Feed',
        'GET',
        '/feeds/watching?limit=20',
        null,
        'Tasks I am watching'
    );

    await testEndpoint(
        'Recent Feed',
        'GET',
        '/feeds/recent?limit=20',
        null,
        'Recently viewed tasks'
    );

    await testEndpoint(
        'Search Tasks',
        'GET',
        '/feeds/search?q=test&limit=20',
        null,
        'Search across all tasks'
    );

    if (projects && projects.length > 0) {
        await testEndpoint(
            'Project Feed',
            'GET',
            `/feeds/projects/${projects[0].id}/general?limit=20`,
            null,
            'Project general feed'
        );
    }

    // ==================== NOTIFICATION SERVICE ====================
    console.log('\n\n📁 NOTIFICATION SERVICE');
    console.log('-'.repeat(80));

    const notifications = await testEndpoint(
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
        'Get unread notification count'
    );

    if (notifications && notifications.content && notifications.content.length > 0) {
        const firstNotification = notifications.content[0];

        await testEndpoint(
            'Mark Notification as Read',
            'PATCH',
            `/notifications/${firstNotification.id}/read`,
            null,
            'Mark specific notification as read'
        );
    }

    await testEndpoint(
        'Mark All Notifications as Read',
        'PATCH',
        '/notifications/read-all',
        null,
        'Mark all notifications as read'
    );

    // ==================== INVITE SERVICE ====================
    console.log('\n\n📁 INVITE SERVICE');
    console.log('-'.repeat(80));

    await testEndpoint(
        'Preview Invite (Invalid Token)',
        'GET',
        '/invites/invalid-token-test',
        null,
        'Preview invite with invalid token (expected to fail)'
    );

    // ==================== CLEANUP ====================
    console.log('\n\n🧹 CLEANUP');
    console.log('-'.repeat(80));

    // Delete created resources in reverse order
    if (results.createdResources.taskId && results.createdResources.projectId) {
        // Check if this is the project we created
        const projectIdForTask = projects && projects.length > 0 ? projects[0].id : results.createdResources.projectId;

        await testEndpoint(
            'Delete Test Task',
            'DELETE',
            `/projects/${projectIdForTask}/tasks/${results.createdResources.taskId}`,
            null,
            'Clean up test task'
        );
    }

    if (results.createdResources.projectId) {
        await testEndpoint(
            'Delete Test Project',
            'DELETE',
            `/projects/${results.createdResources.projectId}`,
            null,
            'Clean up test project'
        );
    }

    // ==================== SUMMARY ====================
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`📊 Total: ${results.success.length + results.failed.length}`);

    // Group by HTTP method
    const methodCounts = {};
    [...results.success, ...results.failed].forEach(r => {
        methodCounts[r.method] = methodCounts[r.method] || { success: 0, failed: 0 };
        if (results.success.includes(r)) {
            methodCounts[r.method].success++;
        } else {
            methodCounts[r.method].failed++;
        }
    });

    console.log('\n📊 By HTTP Method:');
    Object.keys(methodCounts).forEach(method => {
        console.log(`   ${method}: ${methodCounts[method].success} ✅ / ${methodCounts[method].failed} ❌`);
    });

    if (results.failed.length > 0) {
        console.log('\n\n❌ FAILED ENDPOINTS:');
        console.log('='.repeat(80));
        results.failed.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.name}`);
            console.log(`   Method: ${result.method}`);
            console.log(`   Path: ${result.path}`);
            console.log(`   Status: ${result.status}`);
            if (result.sentData) {
                console.log(`   Sent: ${JSON.stringify(result.sentData)}`);
            }
            console.log(`   Error: ${JSON.stringify(result.fullError, null, 2)}`);
        });
    }

    // Save results
    const fs = require('fs');
    const reportPath = './comprehensive-api-test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        summary: {
            total: results.success.length + results.failed.length,
            successful: results.success.length,
            failed: results.failed.length,
            byMethod: methodCounts
        },
        createdResources: results.createdResources,
        results
    }, null, 2));
    console.log(`\n\n📄 Detailed results saved to: ${reportPath}`);
}

runComprehensiveTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
