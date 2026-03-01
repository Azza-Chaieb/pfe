const fs = require('fs');
const path = require('path');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
const svgContent = fs.readFileSync(svgPath, 'utf8');

const parseElements = () => {
    let elements = [];

    // Parse rects
    const rectRegex = /<rect[^>]*id="([^"]+)"[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"[^>]*height="([^"]+)"/g;
    let match;
    while ((match = rectRegex.exec(svgContent)) !== null) {
        if (match[1].startsWith('bureau_')) {
            elements.push({
                id: match[1],
                type: 'rect',
                x: parseFloat(match[2]),
                y: parseFloat(match[3]),
                width: parseFloat(match[4]),
                height: parseFloat(match[5])
            });
        }
    }

    // Parse paths (rough approximation for center based on first M instruction)
    const pathRegex = /<path[^>]*id="([^"]+)"[^>]*d="M\s*([\d.]+)[,\s]+([\d.]+)/g;
    while ((match = pathRegex.exec(svgContent)) !== null) {
        if (match[1].startsWith('bureau_')) {
            elements.push({
                id: match[1],
                type: 'path',
                x: parseFloat(match[2]),
                y: parseFloat(match[3]),
                width: 50, // guess
                height: 50
            });
        }
    }

    // Parse paths with little m (relative)
    const pathRegex2 = /<path[^>]*id="([^"]+)"[^>]*d="m\s*([\d.]+)[,\s]+([\d.]+)/gi; // case insensitive M or m handled separately if needed, but M is mostly absolute

    // Let's also try to get <g> that translates
    const useRegex = /<use[^>]*id="([^"]+)"[^>]*x="([^"]+)"[^>]*y="([^"]+)"/g;
    while ((match = useRegex.exec(svgContent)) !== null) {
        if (match[1].startsWith('bureau_')) {
            elements.push({
                id: match[1],
                type: 'use',
                x: parseFloat(match[2]),
                y: parseFloat(match[3])
            });
        }
    }

    return elements;
};

const elements = parseElements();
console.log(`Parsed ${elements.length} elements with coords`);

// Classify them based on X, Y
// Viewbox is 2780 x 1974
elements.forEach(el => {
    let zone = 'Unknown';
    if (el.x > 2100) {
        zone = 'Right Section (Classrooms)';
    } else if (el.x < 500) {
        zone = 'Left Section (Garden/Guard)';
    } else if (el.x >= 500 && el.x <= 2100) {
        if (el.y > 500 && el.y < 1500) {
            zone = 'Center Section (Meeting rooms/desks)';
        } else {
            zone = 'Top/Bottom Center';
        }
    }
    el.zone = zone;
});

// Let's summarize
const summary = {};
elements.forEach(el => {
    if (!summary[el.zone]) summary[el.zone] = 0;
    summary[el.zone]++;
});

console.log(summary);
fs.writeFileSync('elements_coords.json', JSON.stringify(elements, null, 2));

