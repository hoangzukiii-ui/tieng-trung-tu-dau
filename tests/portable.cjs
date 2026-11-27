const {_electron}=require('playwright-core')
const {mkdtempSync}=require('node:fs')
const path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict')
const course=require('../content/course.json')
const binary=process.argv[2],profile=mkdtempSync(path.join(os.tmpdir(),'Học thử-'))
let app
async function launch(scale){
 app=await _electron.launch({executablePath:binary,args:['--user-data-dir='+profile,'--force-device-scale-factor='+scale,'--host-resolver-rules=MAP * ~NOTFOUND','--autoplay-policy=no-user-gesture-required'],env:{...process.env,TT_TEST_HIDDEN:'1'}})
 const page=await app.firstWindow();await page.context().setOffline(true);page.setDefaultTimeout(4500)
 await page.getByText('Hôm nay học gì?').waitFor()
 return page
}
async function run(){
 let page=await launch(1)
 async function click(name){await page.getByRole('button',{name,exact:true}).click({force:true})}
 const load=()=>page.evaluate(()=>window.study.load())
 assert.equal((await load()).course.lessons.length,15)
 for(const [index,l] of course.lessons.entries()){
 await click(l.title)
 assert.ok((await page.locator('.tt-objective').innerText()).includes(l.notesVi))
 for(let i=0;i<l.itemIds.length;i++){
 if(index===0&&i===0){await page.locator('audio').evaluate(el=>{el.volume=0});await click('Nghe âm thanh');await page.waitForFunction(()=>document.querySelector('audio').readyState>=2)}
 await click('Tiếp tục')
 if(index===0&&i===0){await app.close();page=await launch(1.25);await click(l.title);assert.ok((await page.locator('.tt-step').innerText()).includes('2/'))}
 }
 for(const [j,q] of l.exercises.entries()){
 const listen=['tone_choice','audio_choice'].includes(q.type)
 if(listen){assert.equal(await page.locator('.tt-card .tt-hanzi').count(),0);assert.equal(await page.locator('.tt-card audio').count(),1);assert.ok((await page.locator('audio').getAttribute('src')).endsWith(course.items.find(i=>i.id===q.itemIds[0]).audio))}
 const ids=index===0&&j===0?[q.choices.find(c=>!q.answerIds.includes(c.id)).id]:q.answerIds
 for(const id of ids)await page.locator('.tt-choices button').nth(q.choices.findIndex(c=>c.id===id)).click({force:true})
 await click('Kiểm tra')
 if(listen)assert.ok((await page.locator('.tt-feedback').innerText()).includes(course.items.find(i=>i.id===q.itemIds[0]).pinyin))
 await click(j===l.exercises.length-1?'Hoàn thành':'Tiếp tục')
 }
 assert.ok((await page.locator('main').innerText()).includes('Đã đạt bài học.'))
 if(index===0){await click('Ôn tập');const id=l.exercises[0].itemIds[0];await page.locator('.tt-choices button').getByText(course.items.find(i=>i.id===id).vi,{exact:true}).click({force:true});await click('Kiểm tra');await click('Hoàn thành');await click('← Trang chủ')}else await click('Trang chủ')
 }
 await click('Tiến độ');await page.getByText('15/15 bài đã hoàn thành').waitFor()
 await app.close();page=await launch(1);assert.equal((await load()).progress.completed.length,15)
 console.log('PASS 15 bài, 66 câu, phản hồi nghe, ôn câu sai, phát WAV, tiếp tục sau khi đóng và mở lại, tiến độ 15/15.')
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(app)await app.close().catch(()=>{})})
