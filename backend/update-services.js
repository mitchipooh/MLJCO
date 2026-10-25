const fs=require('fs');const path=require('path');const dir=path.join(__dirname,'data');
const file=path.join(dir,'pages.json');const pages=JSON.parse(fs.readFileSync(file,'utf8'));
const services=[
  ['Painting & Touch-ups','Interior and exterior painting, wall repairs, touch-ups and finishes.'],
  ['Power Washing','Power washing for driveways, patios, decks, roofs and other property surfaces.'],
  ['Small Masonry Works','Repairs, patching and general masonry work.'],
  ['3-Ton Truck Transportation','Hauling, delivery and material transport using a 3-ton truck.'],
  ['Clean-up Works','Debris removal, property clean-ups and junk removal.'],
  ['Plumbing','Repairs to leaky pipes, faucets and toilets, along with general plumbing work.'],
  ['Carpentry','Carpentry repairs, installations and custom work.'],
  ['Electrical','Electrical fixes, installations, upgrades and troubleshooting.'],
  ['Roof Repairs','Leak fixes, shingle replacement and general roof repairs.'],
  ['Ceiling Repairs & Installation','Crack repairs, patching and new ceiling installations.'],
  ['Tile Work','Floor tiling, backsplashes and tile repairs.'],
  ['Fencing & Gates','Installation, repairs and upgrades for fencing and gates.'],
  ['General Maintenance','Property maintenance to keep homes and commercial spaces safe, functional and looking their best.']
];
const escape=s=>s.replaceAll('&','&amp;');
const section={id:'services-property-maintenance',label:'Property Maintenance — Flyer Services',html:`<section class="section"><div class="container"><span class="kicker">Residential &amp; Commercial</span><h2>Property Maintenance Services</h2><p>From small repairs to full property care, M.J.CO Limited helps keep your home or business in shape. No job too big or small.</p><div class="grid-3">${services.map(([title,description])=>`<article class="card"><h3>${escape(title)}</h3><p>${escape(description)}</p></article>`).join('')}</div><div class="cta-band"><div><h3>Need a repair, clean-up or materials transported?</h3><p>Tell us what you need and request a quote for your property or project.</p></div><a class="btn btn-primary" href="request-quote.html">Request a Quote</a></div></div></section>`};
pages.services.sections=pages.services.sections.filter(s=>s.id!==section.id);pages.services.sections.splice(1,0,section);
const intro=pages.services.sections.find(s=>s.id==='services-section-1');intro.html='<section class="page-hero"><div class="container"><span class="kicker">Our Services</span><h1>Construction &amp; Complete Property Care</h1><p>Construction, repairs, maintenance and transportation for residential and commercial customers in Trinidad and Tobago.</p></div></section>';
const list=pages.services.sections.find(s=>s.id==='services-section-2');
if(!list.html.includes('Construction &amp; Specialist Project Services'))list.html=list.html.replace('<div class="container grid-3">','<div class="container"><h2>Construction &amp; Specialist Project Services</h2><div class="grid-3">').replace('</div></section>','</div></div></section>');
// Keep the existing construction scopes, while avoiding duplicate maintenance cards.
list.html=list.html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,card=>/\<h3\>(Property Maintenance|Plumbing &amp; Drainage|Plumbing & Drainage|Roofing &amp; Structural Repairs|Roofing & Structural Repairs)\<\/h3\>/.test(card)?'':card);
list.html=list.html.replace('</div></div></section>','<article class="card"><h3>Roofing &amp; Structural Repairs</h3><p>Roof installation, purlin replacement, flashing, guttering, shed repairs and roof support works.</p></article><article class="card"><h3>Plumbing &amp; Drainage</h3><p>Water line rerouting, drainage solutions, backflow support, pipe installations and related civil repairs.</p></article></div></div></section>');
for(const s of pages['request-quote'].sections){if(!s.html.includes('name="service"'))continue;s.html=s.html.replace(/(<select name="service"[^>]*>)[\s\S]*?<\/select>/,`$1<option value="">Select one</option>${[...new Set([...services.map(s=>s[0]),'General Construction','Civil Works','Renovation & Remodeling','Welding & Fabrication','HSE & Project Support','Gravel & Aggregates'])].map(t=>`<option>${escape(t)}</option>`).join('')}</select>`);}
fs.writeFileSync(file,JSON.stringify(pages,null,2));
const seoFile=path.join(dir,'seo-defaults.json');const seo=JSON.parse(fs.readFileSync(seoFile,'utf8'));seo.services={title:'Construction & Property Maintenance Trinidad | M.J.CO',description:'Construction, property maintenance, electrical work, plumbing, power washing, 3-ton truck transport and gravel enquiries in Trinidad and Tobago.'};fs.writeFileSync(seoFile,JSON.stringify(seo,null,2)+'\n');
const settingsFile=path.join(dir,'management.json');if(fs.existsSync(settingsFile)){const settings=JSON.parse(fs.readFileSync(settingsFile,'utf8'));settings.seo.services={...settings.seo.services,...seo.services};fs.writeFileSync(settingsFile,JSON.stringify(settings,null,2));}
console.log('Added all 13 flyer services, updated quote choices and Services SEO.');
