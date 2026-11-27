const fs=require('node:fs'),path=require('node:path')
const {valid,fresh}=require('../src/core/state.cjs')
function store(dir){
 fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'progress.json'),backup=file+'.bak'
 function read(p){try{const s=JSON.parse(fs.readFileSync(p,'utf8'));return valid(s)?s:null}catch{return null}}
 return {load:()=>read(file)||read(backup)||fresh(),save(s){
 if(!valid(s))throw Error('Tiến độ không hợp lệ')
 fs.writeFileSync(file+'.tmp',JSON.stringify(s),{flush:true})
 if(read(file)){fs.copyFileSync(file,backup+'.tmp');fs.renameSync(backup+'.tmp',backup)}
 fs.renameSync(file+'.tmp',file)
 }}
}
module.exports={store}
