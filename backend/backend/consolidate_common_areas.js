const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
let content = fs.readFileSync(svgPath, 'utf8');

/**
 * LOGIC:
 * 1. The small office previously named bureau_salle_5 (top left) should be part of bureau_1 (Inaccessible).
 * 2. Classes 5 and 6 should be the ONLY interactive rooms in this area.
 * 3. We'll rename the current bureau_salle_5 to something else or merge its path into bureau_1.
 * 4. We'll find two NEW areas for Classe 5 and Classe 6 in the large green zone shown in the user's 3rd capture.
 * 
 * In the capture, there is a large green area with two tables.
 * I previously named them bureau_salle_5 and bureau_salle_6 but the user says those were too big.
 * 
 * Let's assign:
 * - bureau_1: The background + corridor + toilets + security room (old salle 5).
 * - bureau_salle_5: The first table group in the green area.
 * - bureau_salle_6: The second table group in the green area.
 */

const s5_path = 'M10.133 394H229v196H10.133z'; // Existing salle 5 (security room)
const s6_path = 'M774 771h10V462h270v494h506v71h11V867h244v182h10V867h208.01v182h-61.32v382H1825v-293h-10v30h-244v-13h-11v7.88h-100V1107H826V858H468V462h306z'; // Large path

// New targets from the green area shown in capture
const new_salle5 = 'M1000 480h430v350h-430z'; // Focused on top green room
const new_salle6 = 'M1000 870h430v350h-430z'; // Focused on bottom green room

// Everything else goes to bureau_1
const bureau1_base = 'M2251 1645h503v292h-711V443h-531V18h739zM457.926 600H239V384H10V18h447.926zM2033 1937h-473v-416.03h265.07V1442H2033z';
const consolidated_bureau1 = bureau1_base + s5_path + s6_path; // Merging the old paths into background

// Update SVG
const regexS5 = /<path id="bureau_salle_5" d="[^"]+"\/>/;
const regexS6 = /<path id="bureau_salle_6" d="[^"]+"\/>/;
const regexB1 = /<path id="bureau_1" d="[^"]+"\/>/;

content = content.replace(regexB1, `<path id="bureau_1" d="${consolidated_bureau1}"/>`);
content = content.replace(regexS5, `<path id="bureau_salle_5" d="${new_salle5}"/>`);
content = content.replace(regexS6, `<path id="bureau_salle_6" d="${new_salle6}"/>`);

fs.writeFileSync(svgPath, content);
console.log("SVG consolidated. bureau_1 now includes corridors/toilets/security room. New salles targeted at green rooms.");
