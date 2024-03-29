// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { mkdir, writeFile } from 'fs/promises';
import web from 'stream/web';
import * as path from 'node:path';
import Store from 'electron-store';
import contextMenu from 'electron-context-menu'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const store = new Store();

contextMenu({});

function createWindow() {
    // Create the browser window.
    const { width, height } = store.get('mainWindow.bounds', {}) as {width: number, height: number};
    const mainWindow = new BrowserWindow({
        width,
        height,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(app.getAppPath(), 'out', 'preload', 'preload.js')
        },
    });

    // Load the local URL for development or the local
    // html file for production
    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    mainWindow.on('close', () => {
        const { width, height } = mainWindow.getBounds();
        store.set('mainWindow.bounds', { width, height });    
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('createOutputDirectory', async (event, { dirName }) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (win === null) {
        return { canceled: true };
    }
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        properties: ["openDirectory"],
    });

    if (canceled === true || filePaths.length <= 0) {
        return { canceled: true };
    }

    const outputDir = path.join(filePaths[0], dirName);

    try {
        await mkdir(outputDir);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(error);
            await dialog.showMessageBox(win, {
                type: "error",
                title: "Error",
                message: "Cannot create output directory",
                detail: outputDir,
                buttons: ["Close"]
            });
            return { canceled: true };
        }
    }

    return { outputDir, canceled: false };
});

ipcMain.handle("downloadSingleImage", async (_, { imgUrl, outputPath }) => {
    try {
        console.log(`Fetching ${imgUrl}`);
        const req = new Request(imgUrl);
        const res = await fetch(req);
        if (res.body === null) {
            return { error: "Response body is null" };
        }
        console.log(`Finished fetching ${imgUrl}`);
        await writeFile(outputPath, res.body as web.ReadableStream<Uint8Array>);
        console.log(`Finished writefile ${outputPath}`);
    } catch (error) {
        return { error: `${error}` };
    }

    return { error: null };
});

ipcMain.handle("downloadAlbumPage", async (_, { pageUrl }) => {
    try {
        console.log(`Fetching album page ${pageUrl}`);
        const req = new Request(pageUrl);
        const res = await fetch(req);
        const content = await res.text();
        console.log(`Finished fetching album page ${pageUrl}`);
        return { content, error: null };
    } catch (error) {
        return { content: null, error: `${error}` };
    }
});

ipcMain.handle("pathBasename", async (_, { p, ext }) => {
    return path.basename(p, ext);
});

ipcMain.handle("pathJoin", async (_, { paths }) => {
    return path.join(...paths);
});
