const fs=require('fs');const path=require('path');const crypto=require('crypto');const {passwordRecord}=require('./admin-auth');
const file=path.join(__dirname,'data','admin-auth.json');
if(fs.existsSync(file)){console.log('An admin password is already configured. Existing credentials retained.');process.exit(0);}
const password=crypto.randomBytes(24).toString('base64url');
fs.writeFileSync(file,JSON.stringify(passwordRecord(password),null,2),{mode:0o600,flag:'wx'});
fs.writeFileSync(path.join(__dirname,'..','admin-access.txt'),`M.J.CO Website Admin\n\nLogin: http://127.0.0.1:5500/admin\nPassword: ${password}\n\nSave this password in your password manager, then delete this file.\nThe server stores only a salted password hash in backend/data/admin-auth.json.\n`,{mode:0o600,flag:'wx'});
console.log('Admin password configured. Login details saved in admin-access.txt; password not printed.');
