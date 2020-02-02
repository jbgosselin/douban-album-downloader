// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const axios = require('axios').default;
const jQuery = require('jquery');
const { JSDOM } = require('jsdom');
const fs = require('fs').promises;
const path = require('path');
const UserAgent = require('user-agents');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 400,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile('app.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const findAlbumRegex = /^\/photos\/album\/(\d+)/;

ipcMain.handle('startDownload', async (_, { inputUrl }) => {

    let parsedUrl;
    try {
        parsedUrl = new URL(inputUrl);
    } catch (error) {
        console.error(error);
        await dialog.showMessageBox(mainWindow, {
            type: "error",
            title: "Error",
            message: "Cannot parse URL",
            buttons: ["Close"]
        });
        return { ok: false };
    }

    let match = findAlbumRegex.exec(parsedUrl.pathname);
    if (match === null) {
        await dialog.showMessageBox(mainWindow, {
            type: "error",
            title: "Error",
            message: "Not a douban album URL",
            buttons: ["Close"]
        });
        return { ok: false };
    }

    const albumId = match[1];

    let { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
    });

    if (canceled === true || filePaths.length <= 0) {
        return { ok: false };
    }

    const outputDir = path.join(filePaths[0], albumId);

    try {
        await fs.mkdir(outputDir);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(error);
            await dialog.showMessageBox(mainWindow, {
                type: "error",
                title: "Error",
                message: "Cannot create output directory",
                detail: outputDir,
                buttons: ["Close"]
            });
            return { ok: false };
        }
    }

    setImmediate(() => downloadAlbum(albumId, outputDir));

    return { ok: true };
});

const imageSizeRegex = /photo\/\w+\/public/;

async function downloadAlbum(albumId, outputDir) {
    const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();
    console.log(`User-Agent: ${userAgent}`);
    const agent = axios.create({
        baseURL: 'https://www.douban.com',
        headers: { 'User-Agent': userAgent }
    });

    let valueNow = 0;
    let valueMax = 0;
    let imagesPromises = [];

    async function downloadImage(imgUrl) {
        console.log(`Fetching ${imgUrl}`);
        let res = await agent.get(imgUrl, { responseType: 'arraybuffer' });
        console.log(`Finished fetching ${imgUrl}`);
        const imgName = path.basename(imgUrl);
        const imgPath = path.join(outputDir, imgName);
        await fs.writeFile(imgPath, res.data);
        console.log(`Finished writefile ${imgPath}`);
        valueNow += 1;
        mainWindow.send("downloadProgress", { valueNow, valueMax });
    }

    for (; ;) {
        console.log(`Fetching ${albumId} ${valueMax}`);
        let res = await agent.get(`/photos/album/${albumId}`, { params: { "m_start": valueMax } });
        const dom = new JSDOM(res.data);
        const $ = jQuery(dom.window);

        const images = $("div.photo_wrap img");
        if (images.length === 0) {
            break;
        }

        images.each((_, img) => {
            let imgUrl = img.src.replace(imageSizeRegex, 'photo/xl/public');
            imagesPromises.push(downloadImage(imgUrl));
            valueMax += 1;
        });
    }

    console.log(`Waiting all downloads finished`);
    await Promise.all(imagesPromises);
    mainWindow.send("downloadFinished", { outputDir });
}
