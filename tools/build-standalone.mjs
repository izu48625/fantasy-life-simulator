import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=new Map();
const imports=/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm;
function visit(name){
 if(modules.has(name))return;
 const raw=fs.readFileSync(path.join(root,name),'utf8');
 const dependencies=[...raw.matchAll(imports)].map(match=>({
   names:match[1],id:path.posix.normalize(path.posix.join(path.posix.dirname(name),match[2]))
 }));
 for(const dep of dependencies)visit(dep.id);
 const exported=[...raw.matchAll(/\bexport\s+(?:function|const|class)\s+([A-Za-z_$][\w$]*)/g)].map(x=>x[1]);
 modules.set(name,{
  code:raw.replace(imports,'').replace(/\bexport\s+(?=function|const|class)/g,''),
  dependencies,exported
 });
}
visit('src/app.js');
let bundled='/* FANTASY LIFE SIMULATOR — generated; edit src/ */\nconst __modules=Object.create(null);\n';
for(const [id,mod] of modules){
 bundled+='__modules['+JSON.stringify(id)+']=(()=>{\n';
 for(const dep of mod.dependencies)bundled+='const {'+dep.names.split(',').map(x=>x.trim()).join(', ')+'}=__modules['+JSON.stringify(dep.id)+'];\n';
 bundled+=mod.code+'\nreturn {'+mod.exported.join(',')+'};\n})();\n';
}
const css=['base.css','desktop.css','mobile.css'].map(x=>fs.readFileSync(path.join(root,'src/styles',x),'utf8')).join('\n');
const template=fs.readFileSync(path.join(root,'dev/index.template.html'),'utf8');
const html=template.replace(/\s*<link rel="stylesheet" href="\.\/src\/styles\/[^"]+">/g,'')
 .replace(/<script type="module" src="\.\/src\/app\.js"><\/script>/,'')
 .replace('</head>','<style>'+css+'</style>\n</head>')
 .replace('</body>','<script>'+bundled+'</script>\n</body>');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
console.log('Standalone build:',Buffer.byteLength(html),'bytes',modules.size,'modules');
