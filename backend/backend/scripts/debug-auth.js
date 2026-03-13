
const strapi = require('@strapi/strapi');

async function debugPermissions() {
  const app = await strapi().load();
  
  console.log('--- Roles ---');
  const roles = await app.db.query('plugin::users-permissions.role').findMany();
  roles.forEach(r => console.log(`Role: ${r.name} (type: ${r.type}, id: ${r.id})`));

  console.log('\n--- Active Permissions for some roles ---');
  for (const role of roles) {
    if (['authenticated', 'trainer', 'formateur'].includes(role.type) || ['Trainer', 'Authenticated'].includes(role.name)) {
      const perms = await app.db.query('plugin::users-permissions.permission').findMany({
        where: { role: role.id, action: { $contains: 'course' } }
      });
      console.log(`\nPermissions for ${role.name}:`);
      perms.forEach(p => console.log(` - ${p.action}`));
    }
  }

  console.log('\n--- Checking for user BACHAMELS@GMAIL.COM ---');
  const user = await app.db.query('plugin::users-permissions.user').findOne({
    where: { email: 'bachamels@gmail.com' },
    populate: ['role']
  });
  
  if (user) {
    console.log(`User found: ${user.username}, Role: ${user.role?.name} (type: ${user.role?.type})`);
  } else {
    console.log('User not found.');
  }

  process.exit(0);
}

debugPermissions();
