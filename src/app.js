import $ from 'jquery';
import 'popper.js';
import 'bootstrap';

const { ipcRenderer } = require('electron');

export async function onDownloadClicked() {
    let { ok } = await ipcRenderer.invoke('startDownload', {
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
