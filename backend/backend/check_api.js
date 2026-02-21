async function check() {
  const url = "http://localhost:1337/api/coworking-spaces";
  console.log("Fetching", url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}
check();
