async function fetchCourses() {
  try {
    const res = await fetch('http://localhost:1337/api/courses');
    if (!res.ok) {
      console.log('API returned status:', res.status);
      process.exit(1);
    }
    const data = await res.json();
    console.log('Courses returned by API:', JSON.stringify(data.data.map(c => c.title || c.attributes?.title), null, 2));
  } catch(e) {
    console.error('Error fetching API:', e.message);
  }
}
fetchCourses();
