import { ipcRenderer, contextBridge } from 'electron';

interface GlobElectron {
    createOutputDirectory: ({ dirName }: { dirName: string }) => Promise<{ outputDir?: string, canceled: boolean }>
    downloadSingleImage:  ({ imgUrl, outputPath }: { imgUrl: string, outputPath: string }) => Promise<{ error?: string }>
    path: {
        basename: (p: string, ext?: string) => Promise<string>
        join: (...paths: string[]) => Promise<string>
    }
}

contextBridge.exposeInMainWorld('electron', {
    createOutputDirectory: ({ dirName }) => ipcRenderer.invoke('createOutputDirectory', { dirName }),
    downloadSingleImage: ({ imgUrl, outputPath }) => ipcRenderer.invoke('downloadSingleImage', { imgUrl, outputPath }),
    path: {
        basename: (p, ext?) => ipcRenderer.invoke('pathBasename', { p, ext }),
        join: (...paths) => ipcRenderer.invoke('pathJoin', { paths }),
    }
} as GlobElectron);

declare global {
    interface Window {
        electron: GlobElectron
    }
}
  