const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
const content = fs.readFileSync(svgPath, 'utf8').split('\n');

const ids = ['bureau_salle_5', 'bureau_salle_6', 'bureau_1'];

ids.forEach(id => {
    console.log(`--- Paths for ${id} ---`);
    content.forEach((line, index) => {
        if (line.includes(`id="${id}"`)) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    });
});
