let galleryPhotos=[];
async function saveGallery(photos){await api('/api/manage/gallery','PUT',{photos});galleryPhotos=photos;renderGallery();status('Gallery saved. Refresh Projects & Gallery to see your changes.');}
function renderGallery(){
  const list=$('gallery-list');list.replaceChildren();
  if(!galleryPhotos.length)list.textContent='No photos yet. Add an image to display the slideshow.';
  galleryPhotos.forEach((photo,index)=>{
    const row=document.createElement('div');row.className='gallery-admin-row';
    const image=document.createElement('img');image.src=photo.src;image.alt=photo.alt;image.loading='lazy';
    const label=document.createElement('label');label.textContent='Photo description';const alt=document.createElement('input');alt.value=photo.alt;alt.maxLength=300;label.append(alt);
    const controls=document.createElement('div');
    function button(text,action,disabled=false){const b=document.createElement('button');b.type='button';b.textContent=text;b.disabled=disabled;b.onclick=task(action);controls.append(b);}
    button('Save description',()=>saveGallery(galleryPhotos.map((p,i)=>i===index?{...p,alt:alt.value}:p)));
    for(const [text,offset] of [['Move up',-1],['Move down',1]])button(text,()=>{const photos=[...galleryPhotos];[photos[index],photos[index+offset]]=[photos[index+offset],photos[index]];return saveGallery(photos);},index+offset<0||index+offset>=galleryPhotos.length);
    button('Remove',()=>saveGallery(galleryPhotos.filter((_,i)=>i!==index)));
    row.append(image,label,controls);list.append(row);
  });
}
$('gallery-form').onsubmit=task(async()=>{
  const files=[...$('gallery-files').files];if(!files.length)throw Error('Choose at least one photo.');
  if(galleryPhotos.length+files.length>100)throw Error('The gallery holds up to 100 photos.');
  for(const file of files){const form=new FormData();form.append('image',file);const r=await fetch('/api/upload',{method:'POST',body:form});if(r.status===401){location.href='/admin/login.html';return;}const result=await r.json();if(!r.ok)throw Error(result.error||'Upload failed');await saveGallery([...galleryPhotos,{src:result.url,alt:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')}]);}
  $('gallery-files').value='';status('Photos uploaded and added to the slideshow.');
});
$('gallery-url-form').onsubmit=task(async()=>{await saveGallery([...galleryPhotos,{src:$('gallery-url').value.trim(),alt:$('gallery-alt').value.trim()}]);$('gallery-url-form').reset();});
task(async()=>{galleryPhotos=(await api('/api/manage')).gallery||[];renderGallery();})();
