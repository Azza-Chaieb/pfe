// Testing booking creation with both payload structures
async function testBooking() {
    const jwt = ""; // We might need to login first or just try without auth if public route allows POST. 
    // Let's check if the POST /api/bookings is allowed for public by logging in first.

    try {
        // 1. Login to get a valid token
        const loginRes = await fetch('http://localhost:1337/api/auth/local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'bachamel5@gmail.com', // from the user's screenshot
                password: 'password123' // default we can try, or just create a new user
            })
        });

        // Actually, to bypass auth issues, let's just create a new user and login
        const uniqueEmail = `test${Date.now()}@example.com`;
        const regRes = await fetch('http://localhost:1337/api/auth/local/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `testuser_${Date.now()}`,
                email: uniqueEmail,
                password: 'Password123!',
                user_type: 'student'
            })
        });

        const regData = await regRes.json();
        if (!regData.jwt) {
            console.error("Registration failed:", regData);
            return;
        }
        const token = regData.jwt;
        const userId = regData.user.documentId;
        console.log("Logged in with new user:", userId);

        // 2. Fetch a space to book
        const spacesRes = await fetch('http://localhost:1337/api/spaces?populate=equipments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const spacesData = await spacesRes.json();
        if (!spacesData.data || spacesData.data.length === 0) {
            console.error("No spaces found!");
            return;
        }
        const space = spacesData.data[0];
        console.log(`Testing with space: ${space.name} (documentId: ${space.documentId})`);

        // 3. Create booking payload
        const bookingPayload = {
            data: {
                user: { connect: [userId] },
                space: { connect: [space.documentId] },
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600000).toISOString(),
                status: "pending",
                total_price: 900,
                equipments: { connect: [] },
                services: { connect: [] },
                extras: {}
            }
        };

        console.log("Sending payload:", JSON.stringify(bookingPayload, null, 2));

        const bookRes = await fetch('http://localhost:1337/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingPayload)
        });

        const bookData = await bookRes.json();
        console.log("Booking Response:", JSON.stringify(bookData, null, 2));

    } catch (err) {
        console.error("Test script error:", err);
    }
}

testBooking();
