const fs=require('fs');const path=require('path');const crypto=require('crypto');
function passwordRecord(password){const salt=crypto.randomBytes(16).toString('hex');return {salt,hash:crypto.scryptSync(password,salt,64).toString('hex')};}
function register(app,dataDir){
  const sessions=new Map(),attempts=new Map();
  const sessionMs=8*60*60*1000,windowMs=15*60*1000;
  const cleanup=setInterval(()=>{const now=Date.now();for(const [token,until]of sessions)if(until<=now)sessions.delete(token);for(const [ip,a]of attempts)if(a.until<=now)attempts.delete(ip);},60000);cleanup.unref();
  const authFile=path.join(dataDir,'admin-auth.json');
  const record=()=>process.env.ADMIN_PASSWORD?passwordRecord(process.env.ADMIN_PASSWORD):(fs.existsSync(authFile)?JSON.parse(fs.readFileSync(authFile,'utf8')):null);
  const token=req=>(req.headers.cookie||'').match(/(?:^|;\s*)admin=([a-f0-9]{64})(?:;|$)/)?.[1];
  const cookie=(req,value,age)=>`admin=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${req.secure?'; Secure':''}`;
  app.use((req,res,next)=>{
    const route=req.path.toLowerCase();
    if(!route.startsWith('/admin')&&!route.startsWith('/api/'))return next();
    res.setHeader('Cache-Control','no-store');
    if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('origin')&&req.get('origin')!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Cross-origin request rejected.'});
    if(['/api/login','/admin/login.html','/admin/dashboard.css'].includes(route))return next();
    const value=token(req),until=sessions.get(value);
    if(until>Date.now())return next();
    if(value)sessions.delete(value);
    if(route.startsWith('/admin'))return res.redirect('/admin/login.html');
    res.status(401).json({error:'Sign in at /admin/login.html.'});
  });
  app.post('/api/login',(req,res)=>{
    const ip=req.socket.remoteAddress,now=Date.now();let a=attempts.get(ip);
    if(!a||a.until<=now){a={count:0,until:now+windowMs};attempts.set(ip,a);}
    if(a.count>=5){res.setHeader('Retry-After',String(Math.ceil((a.until-now)/1000)));return res.status(429).json({error:'Too many attempts. Try again in 15 minutes.'});}
    const expected=record(),password=req.body?.password;
    if(!expected)return res.status(503).json({error:'Admin access is locked until the owner runs npm run setup-admin.'});
    const valid=typeof password==='string'&&password.length<=1024&&crypto.timingSafeEqual(crypto.scryptSync(password,expected.salt,64),Buffer.from(expected.hash,'hex'));
    if(!valid){a.count++;return res.status(401).json({error:'Incorrect password.'});}
    attempts.delete(ip);const value=crypto.randomBytes(32).toString('hex');sessions.set(value,now+sessionMs);
    res.setHeader('Set-Cookie',cookie(req,value,sessionMs/1000));res.json({ok:true});
  });
  app.post('/api/logout',(req,res)=>{sessions.delete(token(req));res.setHeader('Set-Cookie',cookie(req,'',0));res.json({ok:true});});
}
module.exports={register,passwordRecord};
