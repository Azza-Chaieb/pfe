const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
let content = fs.readFileSync(svgPath, 'utf8');

/**
 * REFINED COORDINATES BASED ON CAPTURES:
 * 
 * 1. bureau_1 (Common Areas - Inaccessible):
 *    - Corridors (blue L-shape)
 *    - Toilets (small squares)
 *    - Kitchen (small icon area)
 *    - Security Bureau (top left small box)
 * 
 * 2. Classes 1-4 (Already likely split, but checking IDs):
 *    - salle_1, salle_2, salle_3, salle_4
 * 
 * 3. Classes 5 & 6 (The two middle-right spaces):
 *    - salle_5: Top middle-right classroom
 *    - salle_6: Bottom middle-right classroom
 */

// Paths for the specific bookable salles (rectangles covering the desks)
const s1_d = 'M2261 1234.05h493.021v400.952H2261z'; // salle_1 placeholder
const s2_d = 'M2261 853h493.021v371H2261z';      // salle_2 placeholder
const s3_d = 'M2261 467h493.021v376H2261z';      // salle_3 placeholder
const s4_d = 'M2261 18h493.021v439H2261z';       // salle_4 placeholder

// Precise rectangles for salle 5 and 6 (middle green rooms)
const s5_d = 'M1635 512h317v330h-317z'; // Refined middle-right top
const s6_d = 'M1635 857h317v366h-317z'; // Refined middle-right bottom

// Common Area (bureau_1) - Everything else in that sector
// We'll combine the hallway and other non-booking parts
const common_d = 'M1415 512h220v711h-220z' + // corridor vertical
    ' M1415 1223h400v288h-400z' + // corridor horizontal
    ' M10 394h219v196H10z' +      // security room
    ' M2033 1442h721v495h-721z';  // others

// Replacement logic
content = content.replace(/<path id="bureau_salle_1" d="[^"]+"\/>/, `<path id="bureau_salle_1" d="${s1_d}"/>`);
content = content.replace(/<path id="bureau_salle_2" d="[^"]+"\/>/, `<path id="bureau_salle_2" d="${s2_d}"/>`);
content = content.replace(/<path id="bureau_salle_3" d="[^"]+"\/>/, `<path id="bureau_salle_3" d="${s3_d}"/>`);
content = content.replace(/<path id="bureau_salle_4" d="[^"]+"\/>/, `<path id="bureau_salle_4" d="${s4_d}"/>`);
content = content.replace(/<path id="bureau_salle_5" d="[^"]+"\/>/, `<path id="bureau_salle_5" d="${s5_d}"/>`);
content = content.replace(/<path id="bureau_salle_6" d="[^"]+"\/>/, `<path id="bureau_salle_6" d="${s6_d}"/>`);
content = content.replace(/<path id="bureau_1" d="[^"]+"\/>/, `<path id="bureau_1" d="${common_d}"/>`);

fs.writeFileSync(svgPath, content);
console.log("SVG paths updated. Common areas grouped in bureau_1, Salles 1-6 individualized.");
