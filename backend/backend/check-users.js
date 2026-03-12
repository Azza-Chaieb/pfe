
const strapi = require('@strapi/strapi');

async function checkUsers() {
  const app = await strapi().load();
  const users = await app.db.query('plugin::users-permissions.user').findMany({
    select: ['id', 'email', 'username']
  });
  console.log(JSON.stringify(users, null, 2));
  await app.destroy();
}

checkUsers();
