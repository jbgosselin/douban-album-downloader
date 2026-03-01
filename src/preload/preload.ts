import { ipcRenderer, contextBridge } from 'electron';

/// <reference types="." />
contextBridge.exposeInMainWorld('electron', {
    createOutputDirectory: ({ dirName }) => ipcRenderer.invoke('createOutputDirectory', { dirName }),
    downloadSingleImage: ({ imgUrl, outputPath, timeout }) => ipcRenderer.invoke('downloadSingleImage', { imgUrl, outputPath, timeout }),
    cancelAllDownloads: () => ipcRenderer.invoke('cancelAllDownloads'),
    openOutputDirectory: ({ dirPath }) => ipcRenderer.invoke('openOutputDirectory', { dirPath }),
    path: {
        basename: (p, ext?) => ipcRenderer.invoke('pathBasename', { p, ext }),
        join: (...paths) => ipcRenderer.invoke('pathJoin', { paths }),
    },
    theme: {
        isDark: () => ipcRenderer.invoke('isDarkMode'),
        onChange: (callback: (_event: unknown, isDark: boolean) => void) => {
            ipcRenderer.on('theme-changed', callback);
        },
    },
} as GlobElectron);
