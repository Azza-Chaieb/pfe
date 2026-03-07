const http = require('http');

const payload = JSON.stringify({
    data: {
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: "pending",
        total_price: 900,
        space: { connect: ["yik3gikwly6ywezszu1er81u"] }, // Example document ID
        equipments: { connect: [] },
        services: { connect: [] }
    }
});

const options = {
    hostname: 'localhost',
    port: 1337,
    path: '/api/bookings',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
