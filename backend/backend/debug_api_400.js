const axios = require("axios");

async function debug() {
  const params = [
    "populate=user,plan&sort=createdAt:desc",
    "populate=*",
    "populate[user]=*&populate[plan]=*",
    "sort=id:desc",
    "populate[user][fields][0]=username&populate[plan][fields][0]=name",
  ];

  for (const p of params) {
    const url = `http://localhost:1337/api/user-subscriptions?${p}`;
    console.log(`\n--- Testing: ${p} ---`);
    try {
      const res = await axios.get(url);
      console.log("Status: SUCCESS", res.status);
    } catch (err) {
      console.log("Status: ERROR", err.response?.status);
      console.log(
        "Body:",
        JSON.stringify(
          err.response?.data?.error || err.response?.data,
          null,
          2,
        ),
      );
    }
  }
}

debug();
