const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
const content = fs.readFileSync(svgPath, 'utf8');

// Function to find bounding box of a path by looking at its 'd' attribute
// This is a rough estimation but helpful for placing rectangles
function findPathInfo(id) {
    const regex = new RegExp(`<path id="${id}" d="([^"]+)"`, 'i');
    const match = content.match(regex);
    if (match) {
        return match[1];
    }
    return null;
}

console.log("Current Path Definitions:");
console.log("bureau_1:", findPathInfo('bureau_1'));
console.log("bureau_salle_5:", findPathInfo('bureau_salle_5'));
console.log("bureau_salle_6:", findPathInfo('bureau_salle_6'));
