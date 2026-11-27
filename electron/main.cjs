const {app,BrowserWindow,ipcMain,session}=require('electron')
const path=require('node:path'),fs=require('node:fs')
const {pathToFileURL}=require('node:url')
const {store}=require('./storage.cjs')
if(!app.requestSingleInstanceLock())app.quit()
else app.whenReady().then(()=>{
 const root=path.join(__dirname,'..'),dir=fs.existsSync(path.join(root,'content/course.json'))?'content':'fixtures'
 const course=JSON.parse(fs.readFileSync(path.join(root,dir,'course.json'),'utf8'))
 const entry=path.join(root,'dist/index.html'),storage=store(app.getPath('userData'))
 session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_,done)=>done({cancel:true}))
 session.defaultSession.setPermissionRequestHandler((_,__,done)=>done(false))
 const win=new BrowserWindow({show:process.env.TT_TEST_HIDDEN!=="1",width:1080,height:740,minWidth:500,minHeight:420,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false}})
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}))
 win.webContents.on('will-navigate',e=>e.preventDefault())
 const check=e=>{if(e.senderFrame?.url!==pathToFileURL(entry).href)throw Error('Trang không hợp lệ')}
 ipcMain.handle('load',e=>{check(e);return {course,progress:storage.load(),assetBase:pathToFileURL(path.join(root,dir)+path.sep).href}})
 ipcMain.handle('save',(e,s)=>{check(e);storage.save(s)})
 win.loadFile(entry)
})
app.on('window-all-closed',()=>app.quit())


