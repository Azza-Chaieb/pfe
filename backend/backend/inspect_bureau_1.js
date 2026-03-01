const fs = require('fs');
const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
const content = fs.readFileSync(svgPath, 'utf8').split('\n');

const id = 'bureau_1';
content.forEach((line, index) => {
    if (line.includes(`id="${id}"`)) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
        // Let's also see 50 lines around it to find related elements
        for (let i = Math.max(0, index - 10); i <= Math.min(content.length - 1, index + 50); i++) {
            console.log(`${i === index ? '=>' : '  '} ${i + 1}: ${content[i].trim()}`);
        }
    }
});
