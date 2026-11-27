import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {HomeScreen,LessonScreen,ReviewScreen,ProgressScreen,DataErrorScreen} from '../ui'
import type {Exercise,Item,ModuleSummary,PracticeStep} from '../ui'
import core from '../core/state.cjs'
import '@fontsource/noto-sans-sc/400.css'
import './integration.css'

interface Lesson {id:string;title:string;objective:string;notesVi?:string;itemIds:string[];prerequisiteIds:string[];exercises:Exercise[]}
interface Course {modules:{id:string;title:string;lessonIds:string[]}[];lessons:Lesson[];items:Item[]}
type Attempt={id:string;lesson:string;answers:Record<string,string[]>;step?:number}
type State={version:number;completed:string[];receipts:string[];pinyin:boolean;attempt:Attempt|null;mistakes:Record<string,number>;reviews:Record<string,{due:string;stage:number}>}
type Data={course:Course;progress:State;assetBase:string}
declare global{interface Window{study:{load():Promise<Data>;save(s:State):Promise<void>}}}
function App({course,progress,assetBase}:Data){
 const [s,set]=useState(progress),[page,go]=useState('home'),[queue,setQueue]=useState<string[]>([]),[reviewAnswer,setAnswer]=useState<string[]>(),[error,setError]=useState('')
 const items=Object.fromEntries(course.items.map(i=>[i.id,i]))
 const lessons=Object.fromEntries(course.lessons.map(l=>[l.id,l]))
 function update(fn:(d:State)=>void){const d=structuredClone(s);fn(d);set(d);window.study.save(d).catch(()=>setError('Không lưu được tiến độ. Kiểm tra dung lượng ổ đĩa.'))}
 const due=Object.keys(s.reviews).filter(id=>items[id]&&s.reviews[id].due<=core.day())
 const modules:ModuleSummary[]=course.modules.map(m=>({...m,lessons:m.lessonIds.map(id=>({id,title:lessons[id].title,status:s.completed.includes(id)?'completed':lessons[id].prerequisiteIds.every(p=>s.completed.includes(p))?'available':'locked'}))}))
 const a=s.attempt,l=a&&lessons[a.lesson]
 const summaries=modules.flatMap(m=>m.lessons)
 const next=summaries.find(x=>x.id===a?.lesson&&!s.receipts.includes(a.id))||summaries.find(x=>x.status==='available')
 function start(id:string){
 if(!a||a.lesson!==id||s.receipts.includes(a.id))update(d=>{d.attempt={id:crypto.randomUUID(),lesson:id,answers:{},step:0}})
 go('lesson')
 }
 function review(){setQueue(due);setAnswer(undefined);go('review')}
 const base={items,showPinyin:s.pinyin,onTogglePinyin:(v:boolean)=>update(d=>{d.pinyin=v}),onExit:()=>go('home'),resolveAudio:(p:string)=>new URL(p,assetBase).href}
 function feedback(q:Exercise,answer?:string[]){
 if(!answer)return
 const source=items[q.itemIds[0]],listen=['audio_choice','tone_choice'].includes(q.type)
 return {correct:core.grade(q,answer),explanationVi:[listen&&source&&[source.hanzi,source.pinyin,source.vi].join(' · '),q.explanationVi].filter(Boolean).join(' — ')}
 }
 let screen
 if(page==='lesson'&&a&&l){
 const steps:PracticeStep[]=[...l.itemIds.map(id=>({id,itemIds:[id]})),...l.exercises.map(q=>({id:q.id,itemIds:q.itemIds,exercise:['tone_choice','audio_choice'].includes(q.type)?{...q,itemIds:q.itemIds.slice(0,1)}:q}))]
 const n=Math.min(a.step??0,steps.length-1),q=steps[n].exercise
 screen=<LessonScreen {...base} key={a.id} title={l.title} objective={[l.objective,!q&&l.notesVi].filter(Boolean).join(' ')} steps={steps} stepIndex={n} feedback={q?feedback(q,a.answers[q.id]):undefined} onSubmit={ids=>{if(q&&!a.answers[q.id])update(d=>{d.attempt!.answers[q.id]=ids})}} onNext={()=>{if(n+1<steps.length)update(d=>{d.attempt!.step=n+1});else{update(d=>core.finish(d,l));go('result')}}}/>
 }else if(page==='result'&&a&&l){
 const wrong=l.exercises.filter(q=>!core.grade(q,a.answers[q.id]||[]))
 screen=<main className="tt-screen"><h1>Kết quả bài học</h1><section className="tt-panel"><h2>{l.exercises.length-wrong.length}/{l.exercises.length} câu đúng</h2><p>{wrong.length<=l.exercises.length*.2?'Đã đạt bài học.':'Hãy làm lại để đạt ít nhất 80%.'}</p>{wrong.map(q=><p key={q.id}>{q.promptVi} — {q.explanationVi}</p>)}<button onClick={review}>Ôn tập</button><button onClick={()=>go('home')}>Trang chủ</button></section></main>
 }else if(page==='review'){
 const id=queue[0],item=items[id]
 const distractors=item?course.items.filter(i=>i.id!==id&&i.vi!==item.vi).filter((i,n,all)=>all.findIndex(v=>v.vi===i.vi)===n).slice(0,3):[]
 const choices=item?[...distractors,item].sort((a,b)=>a.id.localeCompare(b.id)).map(i=>({id:i.id,label:i.vi})):[]
 const q:Exercise={id:'review-'+id,type:'audio_choice',promptVi:'Nghe và chọn nghĩa phù hợp.',itemIds:[id],choices,answerIds:[id],explanationVi:item?.vi||''}
 screen=<ReviewScreen {...base} dueCount={queue.length} currentItem={item} steps={[{id:q.id,exercise:q,itemIds:[id]}]} stepIndex={0} feedback={feedback(q,reviewAnswer)} onSubmit={ids=>{if(!reviewAnswer){setAnswer(ids);update(d=>core.schedule(d,id,core.grade(q,ids),new Date()))}}} onNext={()=>{const rest=queue.slice(1);if(reviewAnswer&&!core.grade(q,reviewAnswer)&&rest.length)rest.splice(2,0,id);setQueue(rest);setAnswer(undefined)}}/>
 }else if(page==='progress')screen=<ProgressScreen modules={modules} currentModuleId={modules.find(m=>m.lessons.some(l=>l.id===next?.id))?.id} reviewCount={due.length} onExit={base.onExit} onReview={review}/>
 else screen=<HomeScreen modules={modules} nextLesson={next} completedCount={s.completed.length} reviewCount={due.length} onStart={start} onReview={review} onProgress={()=>go('progress')}/>
 return <>{error&&<p role="alert">{error}</p>}{screen}</>
}
const root=createRoot(document.getElementById('root')!)
window.study.load().then(data=>root.render(<App {...data}/>)).catch(()=>root.render(<DataErrorScreen onRetry={()=>location.reload()}/>))
