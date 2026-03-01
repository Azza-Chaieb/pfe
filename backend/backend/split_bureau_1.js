const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
let content = fs.readFileSync(svgPath, 'utf8');

// The line we saw in view_file was:
// <path id="bureau_1" d="M10.133 394H229v196H10.133zM2251 1645h503v292h-711V443h-531V18h739zM774 771h10V462h270v494h506v71h11V867h244v182h10V867h208.01v182h-61.32v382H1825v-293h-10v30h-244v-13h-11v7.88h-100V1107H826V858H468V462h306zM457.926 600H239V384H10V18h447.926zM2033 1937h-473v-416.03h265.07V1442H2033z"/>

const bureau1_remainder = 'M2251 1645h503v292h-711V443h-531V18h739zM457.926 600H239V384H10V18h447.926zM2033 1937h-473v-416.03h265.07V1442H2033z';
const salle5_d = 'M10.133 394H229v196H10.133z';
const salle6_d = 'M774 771h10V462h270v494h506v71h11V867h244v182h10V867h208.01v182h-61.32v382H1825v-293h-10v30h-244v-13h-11v7.88h-100V1107H826V858H468V462h306z';

// Let's use a regex to find the bureau_1 path line.
const regex = /<path\s+id="bureau_1"\s+d="[^"]+"[^>]*\/>/;
const match = content.match(regex);

if (match) {
    const fullLine = match[0];
    const indent = content.substring(content.lastIndexOf('\n', match.index) + 1, match.index);

    const newContent =
        `${indent}<path id="bureau_salle_5" d="${salle5_d}"/>\n` +
        `${indent}<path id="bureau_salle_6" d="${salle6_d}"/>\n` +
        `${indent}<path id="bureau_1" d="${bureau1_remainder}"/>`;

    const updatedContent = content.replace(fullLine, newContent);
    fs.writeFileSync(svgPath, updatedContent);
    console.log("SVG successfully updated with regex.");
} else {
    console.error("Could not find bureau_1 path with regex.");
    process.exit(1);
}
