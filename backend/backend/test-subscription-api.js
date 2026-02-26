const fetch = require('node-fetch');

async function checkApi() {
    console.log('🔍 Testing Subscription API...');

    try {
        // Attempt to fetch plans (public endpoint usually, or just check connectivity)
        const response = await fetch('http://localhost:1337/api/subscriptions/plans');

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Connection Successful!');
            console.log('✅ Found plans:', data.data ? data.data.length : 0);
            console.log('--- Verify Completed ---');
        } else {
            console.error('❌ API Error:', response.status, response.statusText);
            console.log('Make sure your backend server is running on port 1337.');
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection Refused. Is the Strapi server running?');
            console.log('Run `npm run develop` in the backend folder.');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

checkApi();
