const {test}=require('node:test');const assert=require('node:assert/strict');const hero=require('./hero');
test('hero includes only featured published videos with escaped captions and muted autoplay',()=>{
  const post={title:'Pool & <garden>',status:'published',placement:'featured',video:'https://www.facebook.com/watch/?v=123',cover:'/assets/images/projects/pool.jpg'};
  const html=hero([post,{...post,status:'draft'},{...post,placement:'journal'},{...post,video:'javascript:alert(1)'}]);
  assert.equal((html.match(/<template /g)||[]).length,1);assert.ok(html.includes('Pool &amp; &lt;garden&gt;'));assert.ok(html.includes('autoplay=true'));assert.ok(html.includes('mute=1'));assert.ok(html.includes('hero-poster'));assert.ok(!html.includes('javascript:'));
});
