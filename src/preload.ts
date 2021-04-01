import { ipcRenderer, contextBridge } from 'electron';
import { basename, join } from 'path';

interface GlobElectron {
    createOutputDirectory: ({ dirName }: { dirName: string }) => Promise<{ outputDir?: string, canceled: boolean }>
    downloadSingleImage:  ({ imgUrl, outputPath }: { imgUrl: string, outputPath: string }) => Promise<{ error?: string }>
    path: {
        basename: (p: string, ext?: string) => string
        join: (...paths: string[]) => string
    }
}

contextBridge.exposeInMainWorld('electron', {
    createOutputDirectory: ({ dirName }) => ipcRenderer.invoke('createOutputDirectory', { dirName }),
    downloadSingleImage: ({ imgUrl, outputPath }) => ipcRenderer.invoke('downloadSingleImage', { imgUrl, outputPath }),
    path: {
        basename: (p, ext?) => basename(p, ext),
        join: (...paths) => join(...paths),
    }
} as GlobElectron);

declare global {
    interface Window {
        electron: GlobElectron
    }
}
  