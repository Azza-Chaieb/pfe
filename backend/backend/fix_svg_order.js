const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
let content = fs.readFileSync(svgPath, 'utf8');

// The original sub-paths of bureau_1
const salle5_d = 'M10.133 394H229v196H10.133z';
const salle6_d = 'M774 771h10V462h270v494h506v71h11V867h244v182h10V867h208.01v182h-61.32v382H1825v-293h-10v30h-244v-13h-11v7.88h-100V1107H826V858H468V462h306z';
const filler_d = 'M2251 1645h503v292h-711V443h-531V18h739zM457.926 600H239V384H10V18h447.926zM2033 1937h-473v-416.03h265.07V1442H2033z';

// We restore bureau_1 to ONLY be the filler areas (white space),
// then add salle 5 and 6 AFTER it so they are on top and clickable.
const regexMain = /<path\s+id="bureau_(salle_[56]|1)"\s+d="[^"]+"\s*\/>/g;
const match = content.match(regexMain);

if (match) {
    // Find the indentation of the first match
    const firstMatchIndex = content.indexOf(match[0]);
    const indent = content.substring(content.lastIndexOf('\n', firstMatchIndex) + 1, firstMatchIndex);

    // Replace all occurrences with the new ordered set
    // We remove the old ones first
    let updatedContent = content.replace(regexMain, '');

    // Now insert the new ones at the position of the first original bureau_1
    const finalElements =
        `${indent}<path id="bureau_1" d="${filler_d}"/>\n` +
        `${indent}<path id="bureau_salle_5" d="${salle5_d}"/>\n` +
        `${indent}<path id="bureau_salle_6" d="${salle6_d}"/>`;

    // We rejoin and insert
    const finalContent = updatedContent.slice(0, firstMatchIndex) + finalElements + updatedContent.slice(firstMatchIndex);

    fs.writeFileSync(svgPath, finalContent);
    console.log("SVG successfully updated with correct order (bureau_1 background, salles on top).");
} else {
    // Fallback if I already played with Salle 5/6 names
    console.error("Could not find targets. Manual check needed.");
}
