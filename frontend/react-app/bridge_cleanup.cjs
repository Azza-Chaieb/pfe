const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

try {
    const backendDir = 'c:\\Users\\DELL\\sunspace\\backend\\backend';
    const scriptFile = process.argv[2] || 'list_tables.js';
    console.log(`Changing directory to: ${backendDir}`);
    process.chdir(backendDir);
    
    console.log(`Running node ${scriptFile}...`);
    try {
        const output = execSync(`node ${scriptFile}`, { encoding: 'utf-8' });
        fs.writeFileSync('C:\\Users\\DELL\\sunspace\\frontend\\react-app\\out_strapi.log', output);
        console.log("Success! Output written to out_strapi.log");
    } catch(err) {
        fs.writeFileSync('C:\\Users\\DELL\\sunspace\\frontend\\react-app\\out_strapi.log', err.stdout + '\n' + err.stderr);
        console.log("Error! Output written to out_strapi.log");
    }
} catch (err) {
    console.error("Bridge execution failed:");
    console.error(err.stdout || err.stderr || err.message);
}
