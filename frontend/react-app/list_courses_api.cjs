const axios = require('axios');

async function listCourses() {
    try {
        const res = await axios.get('http://localhost:1337/api/courses?pagination[limit]=100');
        const courses = res.data.data || [];
        console.log("Found " + courses.length + " courses:");
        courses.forEach(c => {
            console.log(`- "${c.attributes.title}" (ID: ${c.id})`);
        });
    } catch (err) {
        console.error("Error listing courses:", err.message);
    }
}

listCourses();
