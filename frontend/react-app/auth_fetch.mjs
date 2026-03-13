import fetch from 'node-fetch'; // if available, or just use native fetch in node 18+

async function run() {
  try {
    // 1. authenticate
    console.log('Authenticating...');
    const authRes = await fetch('http://localhost:1337/api/auth/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'nawresbfraj@gmail.com', // or azachaieb@gmail.com
        password: 'Password123' // default password often used in testing
      })
    });
    
    if (!authRes.ok) throw new Error('Auth failed: ' + authRes.status);
    const authData = await authRes.json();
    const token = authData.jwt;
    console.log('Got JWT length:', token.length);

    // 2. Fetch courses
    console.log('Fetching courses...');
    const res = await fetch('http://localhost:1337/api/courses?populate=*', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    console.log('Total courses fetched:', data.data?.length);
    if(data.data) {
        data.data.forEach(c => console.log(`- ${c.attributes?.title || c.title} (ID: ${c.id}, documentId: ${c.documentId})`));
    }
  } catch (err) {
    console.error(err);
  }
}
run();
