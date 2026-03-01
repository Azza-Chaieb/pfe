const fs = require('fs');
const svgPath = 'c:/Users/DELL/sunspace/frontend/react-app/public/plan_v2.svg';
let svgContent = fs.readFileSync(svgPath, 'utf8');

const target = '<path id="bureau_4" d="M2261 1234.05h493.021v400.952H2261zm0-381.05h493.021v371H2261zm0-386h493.021v376H2261zm0-449h493.021v439H2261zm-749 444v50h-17.04v330H1415v104h-351V462z"/>';

const replacement = `
<path id="bureau_salle_1" d="M2261 1234.05h493.021v400.952H2261z"/>
<path id="bureau_salle_2" d="M2261 853h493.021v371H2261z"/>
<path id="bureau_salle_3" d="M2261 467h493.021v376H2261z"/>
<path id="bureau_salle_4" d="M2261 18h493.021v439H2261z"/>
<path id="bureau_4_remainder" d="M1512 462v50h-17.04v330H1415v104h-351V462z"/>
`;

const regex = /<path\s+id="bureau_4"\s+d="M\s*2261\s+1234\.05\s*h\s*493\.021\s*v\s*400\.952\s*H\s*2261\s*z\s*m\s*0\s*-381\.05\s*h\s*493\.021\s*v\s*371\s*H\s*2261\s*z\s*m\s*0\s*-386\s*h\s*493\.021\s*v\s*376\s*H\s*2261\s*z\s*m\s*0\s*-449\s*h\s*493\.021\s*v\s*439\s*H\s*2261\s*z\s*m\s*-749\s*444\s*v\s*50\s*h\s*-17\.04\s*v\s*330\s*H\s*1415\s*v\s*104\s*h\s*-351\s*V\s*462\s*z"\s*\/>/i;

if (regex.test(svgContent)) {
    svgContent = svgContent.replace(regex, replacement.trim());
    fs.writeFileSync(svgPath, svgContent);
    console.log('Successfully replaced bureau_4 with split paths.');
} else {
    console.log('Target string not found via regex!!!');
}
