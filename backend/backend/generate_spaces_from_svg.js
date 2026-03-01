const fs = require('fs');
const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
const svgContent = fs.readFileSync(svgPath, 'utf8');

const idRegex = /id="(bureau_[^"]*)"/g;
let match;
const elements = [];

while ((match = idRegex.exec(svgContent)) !== null) {
    const id = match[1];
    const startIndex = match.index;
    const block = svgContent.substring(startIndex > 50 ? startIndex - 50 : 0, startIndex + 200);

    let x = 0, y = 0;
    let foundCoords = false;

    // Try finding x="123" y="123"
    const attrMatch = block.match(/x="([-\d.]+)"[^>]*y="([-\d.]+)"/);
    if (attrMatch) {
        x = parseFloat(attrMatch[1]);
        y = parseFloat(attrMatch[2]);
        foundCoords = true;
    }

    // Try finding transform="matrix(a b c d e f)" or transform="translate(x y)"
    if (!foundCoords) {
        const transMatch = block.match(/transform="([^"]+)"/);
        if (transMatch) {
            const translates = transMatch[1].match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
            if (translates) {
                x = parseFloat(translates[1]);
                y = parseFloat(translates[2]);
                foundCoords = true;
            }
            const matrix = transMatch[1].match(/matrix\([-\d.]+[,\s]+[-\d.]+[,\s]+[-\d.]+[,\s]+[-\d.]+[,\s]+([-\d.]+)[,\s]+([-\d.]+)\)/);
            if (matrix) {
                x = parseFloat(matrix[1]);
                y = parseFloat(matrix[2]);
                foundCoords = true;
            }
        }
    }

    // Try finding d="M 123 456" or "M123.4 56.7" or "m123 45"
    if (!foundCoords) {
        const dMatch = block.match(/d="[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/);
        if (dMatch) {
            x = parseFloat(dMatch[1]);
            y = parseFloat(dMatch[2]);
            foundCoords = true;
        }
    }

    // Try finding <use ... x="123" y="123"
    if (!foundCoords) {
        const useMatch = block.match(/<use[^>]*x="([-\d.]+)"[^>]*y="([-\d.]+)"/);
        if (useMatch) {
            x = parseFloat(useMatch[1]);
            y = parseFloat(useMatch[2]);
            foundCoords = true;
        }
    }

    elements.push({ id, x, y, foundCoords });
}

fs.writeFileSync('spaces_mapped.json', JSON.stringify(elements, null, 2));
console.log(`Mapped ${elements.length} elements. Coords found for ${elements.filter(e => e.foundCoords).length}`);
