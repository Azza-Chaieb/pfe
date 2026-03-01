const fs = require('fs');
const path = require('path');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
const svgContent = fs.readFileSync(svgPath, 'utf8');

const idRegex = /id="([^"]+)"/g;
let match;
const ids = new Set();

while ((match = idRegex.exec(svgContent)) !== null) {
    if (match[1].startsWith('bureau_') || match[1].startsWith('salle_') || match[1].startsWith('room_') || match[1].includes('zone')) {
        ids.add(match[1]);
    }
}

console.log('Found ' + ids.size + ' IDs.');
fs.writeFileSync('ids.json', JSON.stringify(Array.from(ids).sort(), null, 2));
