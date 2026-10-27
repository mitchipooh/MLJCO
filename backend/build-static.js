// Export public HTML only. Admin pages, API code and private data are never published.
const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const site=new URL(process.env.SITE_URL || 'https://mjcogroup.com/');
if(!site.pathname.endsWith('/'))site.pathname+='/';
const port=Number(process.env.EXPORT_PORT || 5599),origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['backend/server.js'],{cwd:root,env:{...process.env,HOST:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});
let failure='';server.stderr.on('data',chunk=>failure+=chunk);
async function main(){
  let ready=false;
  for(let i=0;i<300;i++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{}if(server.exitCode!==null)throw Error(failure || 'Export server exited');await new Promise(r=>setTimeout(r,100));}
  if(!ready)throw Error('Export server did not start');
  fs.mkdirSync(out,{recursive:true});
  const keys=['index','about','services','projects','safety-quality','request-quote','contact','journal'];
  for(const key of keys){
    const response=await fetch(origin+(key==='journal'?'/journal':`/${key}.html`));if(!response.ok)throw Error('Unable to export '+key);
    let html=await response.text();
    html=html.replaceAll(origin+'/',site.href).replace(/(href|src)="\/(?!\/)/g,`$1="${site.pathname}`);
    html=html.replaceAll('https://mitchipooh.github.io/MLJCO/',site.href);
    html=html.replace(/href="journal"/g,'href="journal.html"').replaceAll(`${site.pathname}journal#`,`${site.pathname}journal.html#`).replaceAll(`href="${site.pathname}admin"`,`href="${site.pathname}admin.html"`);
    const canonical=new URL(key==='index'?'':key+'.html',site).href;
    if(!html.includes('rel="canonical"'))html=html.replace('</head>',`<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head>`);
    fs.writeFileSync(path.join(out,key+'.html'),html);
  }
  fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
  if(fs.existsSync(path.join(root,'backend','uploads')))fs.cpSync(path.join(root,'backend','uploads'),path.join(out,'uploads'),{recursive:true,filter:source=>fs.statSync(source).isDirectory()||/\.(jpg|jpeg|png|webp|gif)$/i.test(source)});
  fs.writeFileSync(path.join(out,'admin.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Website administration</title><body style="font:18px/1.6 sans-serif;max-width:650px;margin:12vh auto;padding:24px"><h1>Website preview</h1><p>This GitHub Pages site is a public preview. The password-protected admin portal will be available on the full hosted website.</p><a href="index.html">Return to the website</a></body></html>');
  fs.writeFileSync(path.join(out,'.nojekyll'),'');
  const home=fs.readFileSync(path.join(out,'index.html'),'utf8');
  if(!home.includes('See our work in action')||!home.includes('class="post-cover"'))throw Error('Featured project cards or photos are missing');
  if(home.indexOf('See our work in action')>home.indexOf('Why Choose M.J.CO Limited'))throw Error('Featured projects are in the wrong position');
  console.log('Exported public website to dist with project cards, photos and journal.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>server.kill());
