import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/TerraTwin_Judge_Top10_Stage_Prep.html');
const pdfPath = path.resolve('c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/TerraTwin_Judge_Top10_Stage_Prep.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Rendering Top 10 Stage Prep HTML to PDF...');
console.log('Source:', htmlPath);
console.log('Target:', pdfPath);

const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
const cmd = `"${chromePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "${fileUrl}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  const stats = fs.statSync(pdfPath);
  console.log(`\nSUCCESS: Generated ${pdfPath}`);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
} catch (err) {
  console.error('Error generating PDF:', err);
  process.exit(1);
}

