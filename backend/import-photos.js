const fs=require('fs');const path=require('path');
async function main(){
  const sources=require('./data/photo-sources.json');
  const seed=require('./data/facebook-import.json');
  const dir=path.join(__dirname,'..','assets','images','projects');fs.mkdirSync(dir,{recursive:true});
  await Promise.all(sources.map(async row=>{
    const post=seed.find(p=>p.title===row.title);if(!post)throw Error('Unknown project');
    const photo=row.images.find(i=>i.width>200);if(!photo)throw Error('Missing cover: '+row.title);
    const filename=post.id+'.jpg';const target=path.join(dir,filename);
    if(!fs.existsSync(target)){
      const response=await fetch(photo.src,{signal:AbortSignal.timeout(20000)});
      if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw Error('Image download failed: '+row.title);
      fs.writeFileSync(target,Buffer.from(await response.arrayBuffer()));
    }
    post.cover='/assets/images/projects/'+filename;post.coverAlt=post.title+' — image from the original project video';
  }));
  const file=path.join(__dirname,'data','management.json');const data=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const post of data.posts){const source=seed.find(p=>p.id===post.id);if(source && !post.cover){post.cover=source.cover;post.coverAlt=source.coverAlt;}}
  fs.writeFileSync(file,JSON.stringify(data,null,2));
  fs.writeFileSync(path.join(__dirname,'data','facebook-import.json'),JSON.stringify(seed,null,2)+'\n');
  console.log('Saved six local project cover photos and updated posts.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
