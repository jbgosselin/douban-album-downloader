import { ipcRenderer } from 'electron';
import {
    startDownloadingImage, doneDownloadingImage, doneAllDownloads,
} from './actions';

export default function (dispatch) {
    ipcRenderer.on("startDownloadingImage", (_, { uri, name, outputPath }) => {
        dispatch(startDownloadingImage({ uri, name, outputPath }));
    });

    ipcRenderer.on("doneDownloadingImage", (_, { name, status, error }) => {
        dispatch(doneDownloadingImage({ name, status, error }));
    });

    ipcRenderer.on("doneAllDownloads", () => {
        dispatch(doneAllDownloads());
    });
}
