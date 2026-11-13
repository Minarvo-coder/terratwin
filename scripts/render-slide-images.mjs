import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const slidesDir = path.resolve('c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/docs/presentation_slides');
const tempHtmlDir = path.resolve('c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/docs/presentation_slides/temp_html');

if (!fs.existsSync(tempHtmlDir)) {
  fs.mkdirSync(tempHtmlDir, { recursive: true });
}

// Read the main preview HTML
const fullHtml = fs.readFileSync('c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/TerraTwin_Pitch_Deck_Preview.html', 'utf8');

// Extract each slide HTML
for (let i = 1; i <= 8; i++) {
  const startMarker = `<div class="slide" id="slide-${i}">`;
  const endMarker = `</div>\n    <div class="speaker-notes-box">`;
  
  const startIdx = fullHtml.indexOf(startMarker);
  const endIdx = fullHtml.indexOf(endMarker, startIdx);
  
  if (startIdx === -1 || endIdx === -1) {
    console.error(`Could not locate slide ${i}`);
    continue;
  }
  
  let slideInner = fullHtml.substring(startIdx + startMarker.length, endIdx);
  slideInner = slideInner.replace(/src="docs\/screenshots\//g, 'src="file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/docs/screenshots/');
  
  const standaloneHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0B0F19;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      width: 1200px;
      height: 675px;
      overflow: hidden;
    }
    .slide {
      width: 1200px;
      height: 675px;
      background: #0B0F19;
      position: relative;
      overflow: hidden;
      padding: 40px 50px;
      display: flex;
      flex-direction: column;
    }
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: #00D2FF;
    }
    .pill {
      display: inline-block;
      align-self: flex-start;
      padding: 4px 14px;
      border-radius: 999px;
      background: #162B4D;
      border: 1px solid #00D2FF;
      color: #00D2FF;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .category-sub {
      font-size: 13px;
      font-weight: 800;
      color: #00D2FF;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .slide-title {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
      margin-bottom: 24px;
    }
    .card {
      background: #131E32;
      border: 1px solid #1E3A5F;
      border-radius: 8px;
      padding: 20px;
    }
    .card h3 {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: 0.02em;
    }
    .card ul {
      list-style: none;
      font-size: 13px;
      line-height: 1.55;
      color: #cbd5e1;
    }
    .card ul li {
      margin-bottom: 8px;
      position: relative;
      padding-left: 16px;
    }
    .card ul li::before {
      content: "•";
      color: #00D2FF;
      position: absolute;
      left: 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="slide">
    ${slideInner}
  </div>
</body>
</html>`;

  const htmlFile = path.resolve(tempHtmlDir, `slide_${i}.html`);
  const pngFile = path.resolve(slidesDir, `slide_${i}.png`);
  fs.writeFileSync(htmlFile, standaloneHtml, 'utf8');
  
  const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;
  const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=1200,675 --screenshot="${pngFile}" "${fileUrl}"`;
  
  console.log(`Rendering Slide ${i} -> ${pngFile}...`);
  execSync(cmd, { stdio: 'ignore' });
  
  if (fs.existsSync(pngFile)) {
    const s = fs.statSync(pngFile);
    console.log(`Slide ${i} rendered successfully (${(s.size / 1024).toFixed(1)} KB)`);
  }
}

// Clean up temp html directory
fs.rmSync(tempHtmlDir, { recursive: true, force: true });
console.log('\nAll 8 slide images rendered successfully!');
