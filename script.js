// const {ipcMain, ipcRenderer, contextBridge} = require("electron");

width = 480;
height = 360;

main_color = "#2a2a36";
sub_color = "#16161d";
main_font_family = "Arial";
monospace_font_family = "Hack";
sub_font_family = "Khmer OS System";

title_obj = document.getElementById("title");
title_obj.style.height = (height*0.12).toString() + "px";

body_obj = document.getElementById("body");
body_obj.addEventListener("input", bodyInputCallback);

title_obj.addEventListener("input", titleInputCallback);
title_obj.addEventListener("beforeinput", (event) => {titleBeforeInputCallback(event)});
window.addEventListener("resize", windowResizeCallback);
window.addEventListener("keyup", (event) => {keyupCallback(event)});

curr_work_dir = "./"
curr_files = [];
updateFiles();

cwd_obj = document.getElementById("location");
cwd_obj.innerText = curr_work_dir;
file_list_obj = document.getElementById("file_list");

curr_buffer = {
    "dir": null, 
    "saved": false,
    "selected_obj": null
};

monospace_status = false;
// console.log(curr_buffer.saved);

// function someFunc() {
//     text_width = calculateTitleTextWidth();
//     window_width = window.innerWidth;
//     console.log("Text Width: " + text_width.toString());
//     console.log("Window Width: " + window_width.toString());

//     if (text_width > window_width) {
//         title_obj.style.height = (height*0.24).toString() + "px";
//     }
// }

function calculateTitleTextWidth() {
    title_text = title_obj.value;
    font_size = height * 0.1;
    font = font_size.toString() + "px Arial";

    canvas_obj = document.createElement("canvas");
    context = canvas_obj.getContext("2d");
    context.font = font;
    width = Math.ceil(context.measureText(title_text).width);
    return width;
}

function updateTitleTextOverflow() {
    // checks is the title text is wider than the window

    title_text_width = calculateTitleTextWidth();
    window_width = window.innerWidth;

    console.log("Title width: " + title_text_width.toString());
    console.log("Window width: " + window_width.toString());
    
    if (title_text_width >= window_width) {
        title_obj.style.height = (height * 0.22).toString() + "px";
    }
    else {
        title_obj.style.height = (height * 0.12).toString() + "px";
    }
}

function limitTitleText() {
    title_obj.value = title_obj.value.substring(0, 50);
}

function windowResizeCallback() {
    console.log("The window has been resized");
    updateTitleTextOverflow();
}

function titleInputCallback() {
    updateTitleTextOverflow();
    limitTitleText();

    curr_buffer.saved = false;
}

function reloadCSS() {
    stylesheet_obj = document.querySelector("link[rel=stylesheet]");
    stylesheet_obj.href += "";
}

async function switchThemeCallback() {
    // theme_switched = await window.switchTheme();
    // if (theme_switched === 0) reloadCSS();

    stylesheet_obj = document.getElementsByTagName('link')[0];
    current_stylesheet = stylesheet_obj.href;
    if (current_stylesheet.endsWith("style_dark.css")) {
        stylesheet_obj.href = "style_light.css";
    }
    else {
        stylesheet_obj.href = "style_dark.css";
    }
}

function saveFileCallback() {
    if (!curr_buffer.saved) {
        title_text = "Title: " + title_obj.value;
        body_text = document.getElementById("body").value;
        ret_this = saveFile(title_text + "\n\n" + body_text, curr_buffer.dir);
        curr_buffer.saved = true;
        // console.log(curr_buffer.saved);
    }
    else {} 
}

function keyupCallback(event) {
    // console.log(event.key);
    if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
        saveFileCallback();
    }
}

async function getCWDFiles() {
    // console.log("HERE");
    // console.log("This is the CWD: ", curr_work_dir);

    ret_this = await getFilesFromMain(curr_work_dir);
    // console.log(ret_this);
    return ret_this;
    // console.log(ret_this);
    // console.log(ret_this["cwd"]);
    // console.log(ret_this["files"]);
}

async function updateFiles() {
    data = await getCWDFiles();
    // console.log(data);
    curr_work_dir = data["cwd"];
    curr_files = data["files"];
    // console.log(curr_work_dir, curr_files);
}

async function openButtonCallback(open_dir_flag) {
    
    if (open_dir_flag === 1) {
        dir = await openDir();
    }

    // console.log("Opening dir: ", dir);

    // console.log("This is the new CWD: ", dir);
    
    curr_work_dir = dir;
    await updateFiles();
    cwd_obj.innerText = curr_work_dir;
    // console.log(curr_files);


    current_child = file_list_obj.firstElementChild;
    while (current_child !== null) {
        // console.log("HELLO");
        file_list_obj.removeChild(current_child);
        current_child = file_list_obj.firstElementChild;
    }

    counter = 1;
    curr_files.forEach((file_name) => {
        if (file_name !== null) {
            append_this = document.createElement("div");
            append_this.classList.add("file_name");
            append_this.setAttribute("num", counter);
            counter += 1;
            append_this.setAttribute("onclick", "loadTextFromFile(this, false)");
            // append_this.addEventListener()
            append_this.innerText = file_name["name"];
            file_list_obj.appendChild(append_this);    
        }
    });
}

currently_loading_text = false;

async function loadTextFromFile(element, recursion_perm) {
    if (!currently_loading_text || recursion_perm) {
        // console.log("current buffer dir: ", curr_buffer.dir);
        // console.log("opening this: ", curr_work_dir + "/" + element.innerText);

        if ((curr_work_dir + "/" + element.innerText) !== curr_buffer.dir) {
            currently_loading_text = true;
            if (body_obj.value === "") {
                text = await loadFile(curr_work_dir + '/' + element.innerText);
                // body_obj.value = text;
                parsed_text = parseAsNote(text);
                if (parsed_text.title !== "") {
                    title_obj.value = parsed_text.title;
                }
                else {
                    title_obj.value = "";
                }
                body_obj.value = parsed_text.body;
                currently_loading_text = false;

                if (curr_buffer.dir !== null) {
                    curr_buffer.selected_obj.classList.remove("selected");
                }
                curr_buffer.selected_obj = element;
                curr_buffer.dir = curr_work_dir + "/" + element.innerText;
                element.classList.add("selected");
                curr_buffer.saved = true;
                // console.log(curr_buffer.saved);
            }
            else {
                if (!curr_buffer.saved) {
                    response = await savePrompt();
                    console.log(response);
                    if (response === "Save") {
                        saved_status = await saveFileCallback();
                        // console.log("Has been saved: ", saved_status);
                        if (saved_status === 0) {
                            body_obj.value = "";
                            // console.log("Saving rn");
                            await openButtonCallback(0); // this updates the file list on the right, in case the current file is saved in the same dir
                        }
                        else {
                        }
                    }
                    else if (response === "Don't Save") {
                        body_obj.value = "";
                    }
                    else if (response === "Cancel") {
                    }
                }
                else {
                    response = "Saved";
                }
                            // console.log("This is the response: ", response);
                
                if (response !== "Cancel") {
                    // loadTextFromFile(element, true);
                    text = await loadFile(curr_work_dir + '/' + element.innerText);
                    // body_obj.value = text;
                    parsed_text = parseAsNote(text);
                    if (parsed_text.title !== "") {
                        title_obj.value = parsed_text.title;
                    }
                    else {
                        title_obj.value = "";
                    }
                    body_obj.value = parsed_text.body;
                    // currently_loading_text = false;


                    if (curr_buffer.dir !== null) {
                        curr_buffer.selected_obj.classList.remove("selected");
                    }
                    curr_buffer.selected_obj = element;
                    curr_buffer.dir = curr_work_dir + "/" + element.innerText;
                    element.classList.add("selected");
                    curr_buffer.saved = true;
                    // console.log(curr_buffer.saved);
                }

                currently_loading_text = false;
            }
        }
    }  
}

function bodyInputCallback() {
    curr_buffer.saved = false;
    // console.log(curr_buffer.saved);
}

function parseAsNote(text) {
    title = "";
    body = "";

    if (text.startsWith("Title: ")) {
        // this can be interpreted as a note
        // title = text.substring(8, 50);
        // body = text.substring(50);
        char_count = 50;
        while (char_count > 0)  {
            find_char_at = 7 + (50 - char_count);
            if (text.charAt(find_char_at) === "" || text.charAt(find_char_at) === "\n") {
                break;
            }
            title = title + text.charAt(find_char_at);
            char_count = char_count - 1;
        }

        body_start_index = (50 - char_count);
        console.log(9 + body_start_index);
        body = text.slice(9 + body_start_index);
    }
    else {
        title = "";
        body = text;
    }

    ret_this = {"title": title, "body": body};
    console.log(ret_this);
    return ret_this;
}

function titleBeforeInputCallback(event) {
    // console.log(event);
    if (event.inputType === "insertLineBreak") {
        event.preventDefault();
    }
}

function monospaceCallback() {

    if (!monospace_status) {
        monospace_status = true;
        body_obj.style.fontFamily = monospace_font_family;
    }
    else {
        monospace_status = false;
        body_obj.style.fontFamily = sub_font_family;
    }
    // console.log(monospace_status);
    // console.log(body_obj.style);
}

function findNumberOfLinesDisplayed() {
    console.log(cwd_obj.innerHeight);
}

// findNumberOfLinesDisplayed();