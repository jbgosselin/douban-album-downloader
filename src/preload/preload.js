import { ipcRenderer, contextBridge } from 'electron';
import path from 'path';

contextBridge.exposeInMainWorld('electron', {
    createOutputDirectory: ({ dirName }) => ipcRenderer.invoke('createOutputDirectory', { dirName }),
    downloadSingleImage: ({ imgUrl, outputPath }) => ipcRenderer.invoke('downloadSingleImage', { imgUrl, outputPath }),
    path: {
        basename: (p, ext) => path.basename(p, ext),
        join: path.join,
    }
});