import 'bootstrap/dist/css/bootstrap.min.css';
import { ipcRenderer } from 'electron';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { Application } from './app';
import store from './redux/store';

ReactDOM.render(
    <Provider store={store}>
        <Application />
    </Provider>,
    document.getElementById('root')
);

export async function onDownloadClicked() {
    const { ok } = await ipcRenderer.invoke('startDownload', {
        inputUrl: $("#inputUrl").val(),
    });

    if (ok !== true) {
        return;
    }

    setDownloadProgress({ valueNow: 0, valueMax: 1 });

    $("#inputStep").addClass("d-none");
    $("#downloadStep").removeClass("d-none");
}

function setDownloadProgress({ valueNow, valueMax }) {
    $("#downloadProgress").attr({
        "aria-valuenow": valueNow,
        "aria-valuemax": valueMax,
    }).css({
        "width": `${valueNow * 100 / valueMax}%`,
    });
}

ipcRenderer.on("downloadProgress", (_, args) => setDownloadProgress(args));

ipcRenderer.on("downloadFinished", (_, { outputDir }) => {
    $("#downloadStep").addClass("d-none");
    $("#finishedStep").removeClass("d-none");
    console.log(outputDir);
});

export function restartProgram() {
    $("#inputUrl").val("");
    $("#finishedStep").addClass("d-none");
    $("#inputStep").removeClass("d-none");
}
