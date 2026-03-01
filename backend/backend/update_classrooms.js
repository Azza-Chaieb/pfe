const fs = require('fs');
const { createStrapi } = require('@strapi/strapi');

async function updateClassrooms() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    console.log('Loading mapped spaces...');
    const elements = JSON.parse(fs.readFileSync('spaces_mapped.json', 'utf8'));

    // The right section is defined by x > 2000.
    // Let's find the y distribution for elements with x > 2000
    const rightElements = elements.filter(el => {
        const idNum = parseInt(el.id.replace('bureau_', ''));
        if (idNum >= 1 && idNum <= 10) return false;
        return el.x > 2000;
    });

    console.log(`Found ${rightElements.length} elements in the right section.`);

    // There are 4 rooms vertically. Let's find the minY and maxY
    const yValues = rightElements.map(e => e.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const height = maxY - minY;
    const roomHeight = height / 4;

    console.log(`Y range: ${minY} to ${maxY}, dividing into 4 rooms of height ~${roomHeight}`);

    let updateCount = 0;
    for (const el of rightElements) {
        // Determine which room this element belongs to (1 to 4 top to bottom)
        let roomNum = 1;
        if (el.y > minY + roomHeight * 3) {
            roomNum = 4;
        } else if (el.y > minY + roomHeight * 2) {
            roomNum = 3;
        } else if (el.y > minY + roomHeight) {
            roomNum = 2;
        }

        const roomName = `Classe ${roomNum}`;

        try {
            // Find the space in db
            const spaces = await app.db.query('api::space.space').findMany({
                where: { mesh_name: el.id }
            });

            if (spaces && spaces.length > 0) {
                await app.db.query('api::space.space').update({
                    where: { id: spaces[0].id },
                    data: { name: `${roomName} - ${el.id}` }
                });
                updateCount++;
            }
        } catch (err) {
            console.error(`Error updating ${el.id}: ${err.message}`);
        }
    }

    console.log(`Successfully updated ${updateCount} elements with new Class room names.`);
    process.exit(0);
}

updateClassrooms().catch(err => {
    console.error(err);
    process.exit(1);
});
