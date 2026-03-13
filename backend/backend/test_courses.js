const { Client } = require('pg');
const client = new Client({ host: '127.0.0.1', port: 5432, database: 'sunspace', user: 'postgres', password: 'postgres' });
client.connect().then(async () => {
    const res = await client.query('SELECT title FROM courses');
    console.log(JSON.stringify(res.rows.map(r => r.title)));
    await client.end();
}).catch(console.error);
