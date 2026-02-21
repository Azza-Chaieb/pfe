const axios = require("axios");
const fs = require("fs");

async function test() {
  const url = "http://localhost:1337/api/coworking-spaces?populate=*";
  let output = `Testing ${url}\n`;
  try {
    const res = await axios.get(url);
    output += `Status: ${res.status}\n`;
    output += `Data: ${JSON.stringify(res.data, null, 2)}\n`;
  } catch (e) {
    output += `Error: ${e.message}\n`;
    if (e.response)
      output += `Response Data: ${JSON.stringify(e.response.data, null, 2)}\n`;
  }
  fs.writeFileSync("api_output.txt", output);
}

test();
