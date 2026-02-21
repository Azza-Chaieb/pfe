const axios = require("axios");

async function test() {
  const url = "http://localhost:1337/api/coworking-spaces?populate=*";
  console.log(`Fetching from ${url}...`);
  try {
    const res = await axios.get(url);
    console.log("STATUS:", res.status);
    console.log("COUNT:", res.data.data ? res.data.data.length : 0);
    if (res.data.data) {
      res.data.data.forEach((item) => {
        console.log(
          `ID: ${item.id} | DocumentID: ${item.documentId} | Name: ${item.attributes?.name || item.name}`,
        );
      });
    }
  } catch (e) {
    console.error("API ERROR:", e.message);
    if (e.response) console.error("Payload:", e.response.data);
  }
}

test();
