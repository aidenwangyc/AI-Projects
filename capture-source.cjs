const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(__dirname,'../companion-ui-fox_菜单配网精简_2026-09-12');
const output=path.join(__dirname,'menu-source-sha256.json');
const hashes={};
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='node_modules')continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.isFile())hashes[path.relative(source,file)]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
}
walk(source);
fs.writeFileSync(output,JSON.stringify(hashes,null,2),{flag:'wx'});
console.log('Protected source files: '+Object.keys(hashes).length);
