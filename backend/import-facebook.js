// Run once to add the reviewed source material. Existing customer edits are preserved.
const fs=require('fs');const path=require('path');
const file=path.join(__dirname,'data','management.json');
const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{seo:{},theme:{accent:'#cc5a1b',background:'#f4efe7',surface:'#fffaf4',text:'#1d1b18',radius:16,font:'sans'},posts:[]};
const posts=require('./data/facebook-import.json');let added=0;
data.imports ||= [];
if(!data.imports.includes('facebook-2026-10-20')){
  for(const post of posts){if(data.posts.some(p=>p.id===post.id))continue;data.posts.push({...post,created:new Date().toISOString(),updated:new Date().toISOString()});added++;}
  data.imports.push('facebook-2026-10-20');
  fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);
}
console.log(`Imported ${added} reviewed Facebook entries. Existing content retained.`);
