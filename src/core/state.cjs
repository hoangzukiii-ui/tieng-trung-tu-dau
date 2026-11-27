const fresh = () => ({version:1,completed:[],mistakes:{},reviews:{},attempt:null,pinyin:true,receipts:[]})
function day(date=new Date(),offset=0){
  const d=new Date(date); d.setDate(d.getDate()+offset)
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
}
function valid(s){
  const record=x=>x && typeof x==='object' && !Array.isArray(x)
  const strings=x=>Array.isArray(x)&&x.every(i=>typeof i==='string')
  return record(s)&&s.version===1&&strings(s.completed)&&strings(s.receipts)&&typeof s.pinyin==='boolean'&&record(s.mistakes)&&Object.values(s.mistakes).every(Number.isSafeInteger)&&record(s.reviews)&&Object.values(s.reviews).every(r=>record(r)&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=4&&/^\d{4}-\d{2}-\d{2}$/.test(r.due))&&(s.attempt===null||(record(s.attempt)&&typeof s.attempt.id==='string'&&typeof s.attempt.lesson==='string'&&record(s.attempt.answers)&&Object.values(s.attempt.answers).every(strings)))
}
function grade(q,ids){return q.answerIds.length===ids.length&&(q.type==='order'?q.answerIds.every((v,i)=>v===ids[i]):new Set(ids).size===ids.length&&ids.every(v=>q.answerIds.includes(v)))}
function schedule(s,id,ok,date){
  const stage=ok?Math.min((s.reviews[id]?.stage||0)+1,4):0
  s.reviews[id]={stage,due:day(date,[0,1,3,7,14][stage])}
  if(!ok)s.mistakes[id]=(s.mistakes[id]||0)+1
}
function finish(s,lesson,date=new Date()){
 const a=s.attempt
 if(!a||a.lesson!==lesson.id||s.receipts.includes(a.id)||lesson.exercises.some(q=>!a.answers[q.id]))return
 const results=new Map(); let correct=0
 for(const q of lesson.exercises){const ok=grade(q,a.answers[q.id]); correct+=Number(ok);for(const id of q.itemIds)results.set(id,ok&&(results.get(id)??true))}
 for(const [id,ok] of results)schedule(s,id,ok,date)
 if(correct/lesson.exercises.length>=0.8&&!s.completed.includes(lesson.id))s.completed.push(lesson.id)
 s.receipts.push(a.id)
}
module.exports={fresh,valid,day,grade,schedule,finish}
