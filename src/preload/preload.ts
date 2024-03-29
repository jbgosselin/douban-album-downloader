import { ipcRenderer, contextBridge } from 'electron';

/// <reference types="." />
contextBridge.exposeInMainWorld('electron', {
    createOutputDirectory: ({ dirName }) => ipcRenderer.invoke('createOutputDirectory', { dirName }),
    downloadSingleImage: ({ imgUrl, outputPath }) => ipcRenderer.invoke('downloadSingleImage', { imgUrl, outputPath }),
    downloadAlbumPage: ({ pageUrl }) => ipcRenderer.invoke('downloadAlbumPage', { pageUrl }),
    path: {
        basename: (p, ext?) => ipcRenderer.invoke('pathBasename', { p, ext }),
        join: (...paths) => ipcRenderer.invoke('pathJoin', { paths }),
    }
} as GlobElectron);
