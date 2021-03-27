// Modules to control application life and create native browser window
const process = require('process');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios').default;
const Store = require('electron-store');
const contextMenu = require('electron-context-menu');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const store = new Store();

contextMenu({});

function createWindow() {
    // Create the browser window.
    const { width, height } = store.get('mainWindow.bounds') || {};
    mainWindow = new BrowserWindow({
        width,
        height,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(app.getAppPath(), 'build', 'preload.js')
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(app.getAppPath(), 'app.html'));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    mainWindow.on('close', () => {
        const { width, height } = mainWindow.getBounds();
        store.set('mainWindow.bounds', { width, height });
    });

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

ipcMain.handle('createOutputDirectory', async (_, { dirName }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
    });

    if (canceled === true || filePaths.length <= 0) {
        return { canceled: true };
    }

    const outputDir = path.join(filePaths[0], dirName);

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
            return { canceled: true };
        }
    }

    return { outputDir, canceled: false };
});

ipcMain.handle("downloadSingleImage", async (_, { imgUrl, outputPath }) => {
    try {
        console.log(`Fetching ${imgUrl}`);
        const res = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        console.log(`Finished fetching ${imgUrl}`);
        await fs.writeFile(outputPath, res.data);
        console.log(`Finished writefile ${outputPath}`);
    } catch (error) {
        return { error: `${error}` };
    }

    return { error: null };
});
