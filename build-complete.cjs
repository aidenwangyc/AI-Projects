const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parseHTML} = require('./.verification/node_modules/linkedom');
const QRCode = require('./.verification/node_modules/qrcode');
const original = path.resolve(__dirname, '../companion-ui-fox');
const baseline = path.resolve(__dirname, '../../LG01_UI_PRD_V3.16_简中预览_2026-09-11/02_UX原型');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = Object.fromEntries(fs.readdirSync(original).filter(n=>fs.statSync(path.join(original,n)).isFile()).map(n=>[n,hash(path.join(original,n))]));
const manifestFile = path.join(__dirname, 'original-sha256.json');
if (!fs.existsSync(manifestFile)) fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
else if (JSON.stringify(JSON.parse(fs.readFileSync(manifestFile))) !== JSON.stringify(manifest)) throw new Error('Original source changed; review before rebuilding');

const {document} = parseHTML(fs.readFileSync(path.join(original,'index.html'),'utf8'));
const templates = {};
for (const scene of ['home','apps','chat']) {
  const node = document.querySelector(`[data-scene="${scene}"]`).cloneNode(true);
  node.classList.add('is-active');
  node.removeAttribute('aria-hidden');
  node.querySelectorAll('[id]').forEach(el=>el.dataset.originalId=el.getAttribute('id'));
  node.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  templates[scene]=node.outerHTML;
}
fs.writeFileSync(path.join(__dirname,'fox-templates.js'),'window.FoxTemplates = '+JSON.stringify(templates)+';\n');
const d=JSON.parse(fs.readFileSync(path.join(baseline,'project-data.json'),'utf8'));
d.summary='Fox UI interaction edition; isolated copy; real device services are simulated.';
d.sourceVersion=d.version;d.version='Fox complete 2026-09-12';
fs.writeFileSync(path.join(__dirname,'project-data.json'),JSON.stringify(d,null,2));
fs.writeFileSync(path.join(__dirname,'project-data.js'),'window.LG01_DATA = '+JSON.stringify(d)+';\n');

async function main(){
  for(let i=1;i<=3;i++)await QRCode.toFile(path.join(__dirname,`assets/setup-demo-${i}.png`),`LUMIQ-DEMO:LG01:SETUP:${i}`,{errorCorrectionLevel:'M',margin:4,scale:8,color:{dark:'#000000',light:'#ffffff'}});
  fs.copyFileSync(path.join(__dirname,'.verification/node_modules/qrcode/license'),path.join(__dirname,'assets/qrcode.LICENSE'));
  console.log('Built Fox templates, 167-page reference data, and 3 decodable demo QR assets.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
