const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
for(const dir of ['fixtures','content'].filter(d=>fs.existsSync(d+'/course.json')))test('Liên kết giáo trình '+dir,()=>{
 const c=JSON.parse(fs.readFileSync(dir+'/course.json','utf8'))
 const ids=rows=>{const values=rows.map(x=>x.id);assert.ok(values.every(Boolean));assert.equal(new Set(values).size,values.length);return new Set(values)}
 ids(c.modules);const items=ids(c.items),lessons=ids(c.lessons);ids(c.lessons.flatMap(l=>l.exercises))
 for(const m of c.modules)assert.ok(m.lessonIds.every(i=>lessons.has(i)))
 for(const l of c.lessons){
 assert.ok(l.prerequisiteIds.every(i=>lessons.has(i)&&i!==l.id));assert.ok(l.itemIds.every(i=>items.has(i)));assert.ok(l.exercises.length)
 for(const q of l.exercises){const choices=ids(q.choices);assert.ok(q.answerIds.length&&q.answerIds.every(a=>choices.has(a)));assert.ok(q.itemIds.every(i=>items.has(i)));assert.ok(q.choices.every(v=>!v.itemId||items.has(v.itemId)));if(q.type==='audio_choice')assert.ok(q.itemIds.some(i=>c.items.find(v=>v.id===i).audio))}
 }
 for(const item of c.items)if(item.audio!==null){const audio=path.resolve(dir,item.audio);assert.ok(audio.startsWith(path.resolve(dir)+path.sep));assert.ok(fs.statSync(audio).size>0)}
})
