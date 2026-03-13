import fs from 'fs';

const files = fs.readdirSync('./');
const envFiles = files.filter(f => f.startsWith('.env') || f.endsWith('.db') || f.endsWith('.sqlite'));
console.log('ENV and DB files found in backend:', envFiles);
const dbFolder = './.tmp';
if (fs.existsSync(dbFolder)) {
    console.log('.tmp folder contents:', fs.readdirSync(dbFolder));
} else {
    console.log('.tmp folder does not exist');
}
