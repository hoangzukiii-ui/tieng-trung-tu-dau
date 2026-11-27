const {contextBridge,ipcRenderer}=require('electron')
contextBridge.exposeInMainWorld('study',{load:()=>ipcRenderer.invoke('load'),save:s=>ipcRenderer.invoke('save',s)})
