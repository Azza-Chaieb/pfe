const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
let content = fs.readFileSync(svgPath, 'utf8');

/**
 * REFINEMENT LOGIC:
 * 
 * Salle 5 (Small office top-left):
 * Original was M10.133 394H229v196H10.133z
 * This seems okay but maybe slightly too wide if it hits the wall.
 * 
 * Salle 6 (Area with 4 table groups):
 * The user wants it limited to just the "frame" of the desks, not the bathroom/white space.
 * Looking at the capture, this area is roughly in the middle-bottom.
 * Coordinate analysis from path: M774 771...
 * 
 * Let's try to define more precise rectangles:
 * 
 * salle_5: The capture shows a desk and two chairs. Let's keep it but slightly inset.
 * salle_6: The capture shows 4 groups of tables. 
 * Looking at the coordinates of the 4 table groups found earlier in ids:
 * bureau_671: x=480, y=940
 * bureau_672: x=680, y=940
 * bureau_673: x=480, y=1140
 * bureau_674: x=680, y=1140
 * (Approximate from previous analysis)
 * 
 * Let's redefine salle 6 to just cover that bounding box area.
 */

// Refined paths (rectangles)
const refined_salle5 = 'M20 404h200v176H20z'; // Slightly inset
const refined_salle6 = 'M784 781h740v336H784z'; // Focused on the 4-table area, excluding the long corridor extension

// The background bureau_1 needs to take back the areas we are NOT using
// Original bureau_1 filler: M2251 1645h503v292h-711V443h-531V18h739zM457.926 600H239V384H10V18h447.926zM2033 1937h-473v-416.03h265.07V1442H2033z
// We will add the "excluded" segments of the previous salle 6 back to bureau_1 if needed, 
// but for simplicity, let's just make the salles smaller and leave bureau_1 as background.

const regexS5 = /<path id="bureau_salle_5" d="[^"]+"\/>/;
const regexS6 = /<path id="bureau_salle_6" d="[^"]+"\/>/;

content = content.replace(regexS5, `<path id="bureau_salle_5" d="${refined_salle5}"/>`);
content = content.replace(regexS6, `<path id="bureau_salle_6" d="${refined_salle6}"/>`);

fs.writeFileSync(svgPath, content);
console.log("SVG refined: salles 5 and 6 now have smaller, focused hitboxes.");
