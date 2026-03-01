const fs = require('fs');
const path = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
const content = fs.readFileSync(path, 'utf8').split('\n');

const ids = ['bureau_4', 'bureau_5', 'bureau_602', 'bureau_594'];

ids.forEach(id => {
    console.log(`--- Search for ${id} ---`);
    content.forEach((line, index) => {
        if (line.includes(`id="${id}"`)) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
            // Let's also see 5 lines before and after
            for (let i = Math.max(0, index - 5); i <= Math.min(content.length - 1, index + 5); i++) {
                console.log(`${i === index ? '=>' : '  '} ${i + 1}: ${content[i].trim()}`);
            }
        }
    });
});
