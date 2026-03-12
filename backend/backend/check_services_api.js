const axios = require("axios");

async function checkServices() {
  try {
    const response = await axios.get(
      "http://localhost:1337/api/services?populate=*",
    );
    const services = response.data.data;
    console.log("--- SERVICES IN DATABASE (via API) ---");
    services.forEach((s) => {
      const attrs = s.attributes || s;
      console.log(
        `ID: ${s.id}, Name: ${attrs.name}, Has Config: ${!!attrs.configuration && Object.keys(attrs.configuration).length > 0}`,
      );
      if (attrs.configuration) {
        console.log("Config:", JSON.stringify(attrs.configuration, null, 2));
      }
    });
    console.log("---------------------------");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkServices();
