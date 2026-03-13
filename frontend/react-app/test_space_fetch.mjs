import axios from 'axios';

async function testFetch() {
    try {
        const res = await axios.get('http://localhost:1337/api/spaces/lvjecbfc2337zcax9zmu42bk?populate=*');
        console.log("Success by documentId:", res.status);
        console.log("Data keys:", Object.keys(res.data.data));
    } catch (err) {
        console.error("Error fetching by documentId:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

testFetch();
