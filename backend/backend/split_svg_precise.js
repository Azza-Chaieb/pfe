const fs = require('fs');

const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
let svgContent = fs.readFileSync(svgPath, 'utf8');

const startIndex = svgContent.indexOf('id="bureau_4"');
if (startIndex !== -1) {
    const startOfPath = svgContent.lastIndexOf('<path', startIndex);
    const endOfPath = svgContent.indexOf('/>', startIndex) + 2;
    const fullPath = svgContent.substring(startOfPath, endOfPath);

    console.log("FOUND PATH:");
    console.log(fullPath);

    const replacement = `
<path id="salle_1" d="M2261 1234.05h493.021v400.952H2261z"/>
<path id="salle_2" d="m0-381.05h493.021v371H2261z" transform="translate(2261, 1234.05)"/>
<path id="salle_3" d="m0-386h493.021v376H2261z" transform="translate(2261, 853)"/>
<path id="salle_4" d="m0-449h493.021v439H2261z" transform="translate(2261, 467)"/>
<path id="bureau_4_remainder" d="m-749 444v50h-17.04v330H1415v104h-351V462z" transform="translate(2261, 18)"/>
`;
    // Wait, the 'm' in SVG is relative to the PREVIOUS point if it's one continuous path.
    // So if I split them into separate paths, the 'm' starts from 0,0!
    // So I need to use M or translate them! Yes! This is why my previous coordinates M2261 853 etc were better.

    const correctReplacement = `
<path id="salle_1" d="M2261 1234.05h493.021v400.952H2261z"/>
<path id="salle_2" d="M2261 853h493.021v371H2261z"/>
<path id="salle_3" d="M2261 467h493.021v376H2261z"/>
<path id="salle_4" d="M2261 18h493.021v439H2261z"/>
<path id="bureau_4_remainder" d="M1512 462v50h-17.04v330H1415v104h-351V462z"/>
`;

    svgContent = svgContent.substring(0, startOfPath) + correctReplacement.trim() + svgContent.substring(endOfPath);
    fs.writeFileSync(svgPath, svgContent);
    console.log("REPLACED!");

} else {
    console.log("NOT FOUND!");
}
