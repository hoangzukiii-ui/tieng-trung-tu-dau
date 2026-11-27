const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os')
const {fresh,finish,grade,schedule}=require('../src/core/state.cjs')
const {store}=require('../electron/storage.cjs')
const lesson=require('../fixtures/course.json').lessons[0]
test('Ghi kết quả một lần, đủ 80% mở bài',()=>{
 const s=fresh(),q=lesson.exercises
 s.attempt={lesson:lesson.id,id:'try',answers:Object.fromEntries(q.map(x=>[x.id,x.answerIds]))}
 finish(s,lesson);finish(s,lesson);assert.deepEqual(s.completed,[lesson.id]);assert.deepEqual(s.receipts,['try']);assert.equal(s.reviews.tone.stage,1)
})
test('Thứ tự và lịch ôn theo ngày địa phương',()=>{
 const s=fresh(),date=new Date(2026,11,31,23,59);assert.equal(grade({type:'order',answerIds:['a','b']},['b','a']),false)
 for(const expected of ['2027-01-01','2027-01-03','2027-01-07','2027-01-14']){schedule(s,'x',true,date);assert.equal(s.reviews.x.due,expected)}
 schedule(s,'x',false,date);assert.deepEqual(s.reviews.x,{stage:0,due:'2026-12-31'})
})
test('Đọc lại JSON và khôi phục bản dự phòng ở đường dẫn có dấu',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'Tiếng Trung-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}))
 const db=store(dir),s=fresh();db.save(s);s.pinyin=false;db.save(s);assert.equal(store(dir).load().pinyin,false)
 fs.writeFileSync(path.join(dir,'progress.json'),'!');assert.deepEqual(db.load(),fresh())
})
