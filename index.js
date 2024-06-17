const {app, BrowserWindow, nativeImage, ipcMain, dialog, nativeTheme} = require("electron");
const path = require("path");
const sub_process = require("child_process");
const fs = require("fs");
const less = require("less");

const WIDTH = 480;
const HEIGHT = 360;

window_icon = null;
// console.log(nativeTheme.themeSource);
if (nativeTheme.themeSource == "system") {
    nativeTheme.themeSource = "dark";
}
if (nativeTheme.themeSource == "dark") {
    window_icon = nativeImage.createFromPath("./Icons/512x512.png");
}
else {
    // console.log('HERE');
    window_icon = nativeImage.createFromPath("./Icons/text_editor_black.png");
}

// window_icon = window_icon.resize({
//     width: 512, 
//     height: 512
// });

// console.log("Size: ", window_icon.getSize());

function createWindow() {
    window_obj = new BrowserWindow(
        {
            width: WIDTH, 
            height: HEIGHT, 
            webPreferences: {
                devTools: false, 
                nodeIntegration: true, 
                preload: path.join(__dirname, "/preload.js")
            }, 
            title: "Text Editor", 
            icon: window_icon
        }
    )

    window_obj.loadFile("index.html");
    window_obj.removeMenu();
    // window_obj.setIcon(window_icon);
    // window_obj.webContents.openDevTools();
    return window_obj;
}

curr_work_dir = path.dirname("./");
curr_files = [];
updateFiles();

app.whenReady().then( () => {
    ipcMain.handle("msg", msgHandler);
    createWindow();
});

async function msgHandler(event, ...args) {
    if (args[0] === "switchTheme") {
        theme_overwritten = await overwriteTheme();
        less_recompiled = null;
        if (theme_overwritten === 0) 
            less_recompiled = await recompileLess();
        return theme_overwritten || less_recompiled;
    }
    else if (args[0] === "saveFile") {
        data = args[1];
        dir = args[2];
        if (dir === null) {
            location = await dialog.showSaveDialog({
                filters: [
                    {name: "Text (*.txt)", extensions: ["txt"]}
                ]
            });
        }
        else {
            location = {"filePath": dir};
        }
        
        // console.log("This is the location: ", location);
        if (location !== "") {
            location = location["filePath"];
            // console.log("Saving");

            fd = fs.openSync(location, "w", 0o666, (err, fd) => {
                if (err) return 1;
                else {};
            });

            fs.writeSync(fd, data, 0, 0, (err, bytesWritten, buffer) => {
                if (err) return 1;
                else {};
            });
            fs.closeSync(fd);
            return 0;
        }
        else {
            console.log("Not Saving");
            return 1;
        }
        
    }
    else if (args[0] === "getFilesFromMain") {
        curr_work_dir = args[1];
        // console.log(curr_work_dir);
        // console.log(curr_work_dir);
        // console.log("This is the CWD: ", curr_work_dir);

        await updateFiles();
        // console.log('EHLLO');
        // console.log(curr_work_dir);
        // console.log(curr_files);
        // return curr_work_dir
        return {"cwd": curr_work_dir, "files": curr_files};
    }
    else if (args[0] === "openDir") {
        dir = dialog.showOpenDialogSync({
            "properties": ["openDirectory"]
        });
        return dir;
    }
    else if (args[0] === "loadFile") {
        // fd = fs.openSync(args[1], "r", 0o666, (err, fd) => {
        //     if (err) return 1;
        //     else {}
        // });
        return fs.readFileSync(args[1], "utf-8");
    }
    else if (args[0] == "savePrompt") {
        responses = ["Save", "Don't Save", "Cancel"];
        // console.log(responses.toString());
        selection = dialog.showMessageBoxSync({
            "message": "The current buffer has not been saved yet. Would you like to save it?", 
            "type": "warning", 
            "buttons": responses, 
            "defaultId": 0, 
            "title": "File not saved...", 
            "cancelId": 2, 
        });

        return responses[selection];
    }
}

async function overwriteTheme() {

    less_content = (fs.readFileSync("./theme.less")).toString();
    new_theme = null;

    if (less_content === "@theme: 'Light';\n") {
        new_theme = "@theme: 'Dark';\n";
    }
    else {
        new_theme = "@theme: 'Light';\n";
    }

    less_fd = fs.openSync("./theme.less", "w", 0o666, (err, fd) => {
        if (err) {
            // console.error(err);
            return 1;
        }
        else {
        }
    });

    fs.writeSync(less_fd, new_theme, 0, 0, (err, bytesWritten, buffer) => {
        // if (err) console.error(err);
        if (err) return 1;
        else {}
    });
    fs.closeSync(less_fd);

    return 0;
}

async function recompileLess() {
    sub_process.exec("lessc style.less style.css", (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            // process.exit(1);
        }
        else {
            // console.log("less compiled");
            // process.exit(0);
        }
    });

    return 0;
}

async function getFiles(curr_work_dir) {
    // console.log("This is the CWD: ", curr_work_dir);
    dir = fs.opendirSync(curr_work_dir);
    dir_entries = [];
    length = 0;
    while (true) {
        // dir_entries.push(dir.readSync());
        // if (dir_entries[])
        push_this = dir.readSync();
        if (push_this !== null) {
            if (push_this.isFile()) {
                if (push_this.name.endsWith(".txt")){
                    dir_entries.push(push_this);
                    length += 1;
                }   
            }
        }
        else {
            break;
        }
        
        // length += 1;
        // if (dir_entries[length - 1] === null) break;
    }
    console.log("These are the directory entries: ", dir_entries);

    return dir_entries;
}

async function updateFiles() {
    curr_files = await getFiles(curr_work_dir);
}

// console.log(less);