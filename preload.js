const {ipcMain, ipcRenderer, contextBridge} = require("electron");

console.log("PRELOADING");

function switchTheme() {
    return ipcRenderer.invoke("msg", "switchTheme");
};
function saveFile(data, dir) {
    // console.log(data);
    return ipcRenderer.invoke("msg", "saveFile", data, dir);
};
async function getFilesFromMain(dir) {
    // console.log("This is the CWD: ", dir);

    ret_this = await ipcRenderer.invoke("msg", "getFilesFromMain", dir[0]);
    // console.log(ret_this);
    return ret_this;
}
async function openDir() {
    return await ipcRenderer.invoke("msg", "openDir");
}
async function loadFile(address) {
    return await ipcRenderer.invoke("msg", "loadFile", address);
}

async function savePrompt() {
    return await ipcRenderer.invoke("msg", "savePrompt");
}

contextBridge.exposeInMainWorld("switchTheme", switchTheme);
contextBridge.exposeInMainWorld("saveFile", (data, dir) => {return saveFile(data, dir)});
contextBridge.exposeInMainWorld("getFilesFromMain", async (dir) => {return await getFilesFromMain(dir)});
contextBridge.exposeInMainWorld("openDir", openDir);
contextBridge.exposeInMainWorld("loadFile", async (address) => {return await loadFile(address)});
contextBridge.exposeInMainWorld("savePrompt", savePrompt);