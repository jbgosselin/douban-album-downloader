import axios from 'axios';
import $ from 'jquery';

import {
    START_DOWNLOADING_IMAGE, DONE_DOWNLOADING_IMAGE, DONE_ALL_DOWNLOADS,
    START_DOWNLOADING_ALBUM, RESTART_APP, RETRY_FAILED_DOWNLOAD,
} from './actionTypes';

import { DOWNLOAD_STATUS } from '../constants';

export const startDownloadingAlbum = () => ({
    type: START_DOWNLOADING_ALBUM,
});

export const startDownloadingImage = ({ uri, name, outputPath }) => ({
    type: START_DOWNLOADING_IMAGE,
    uri,
    name,
    outputPath,
});

export const doneDownloadingImage = ({ name, status }) => ({
    type: DONE_DOWNLOADING_IMAGE,
    name,
    status,
});

export const doneAllDownloads = () => ({
    type: DONE_ALL_DOWNLOADS,
});

export const restartApp = () => {
    window.location.reload();
    return { type: RESTART_APP };
};

const imageSizeRegex = /photo\/\w+\/public/;

export const startDownloadAlbum = ({ albumId, albumUrl, pageKey, imgSelector }) => async dispatch => {
    const { outputDir, canceled } = await window.electron.createOutputDirectory({
        dirName: albumId,
    });

    if (canceled === true) {
        return;
    }

    dispatch(startDownloadingAlbum());

    let valueMax = 0;
    const imagesPromises = [];

    const downloadImage = async ({ imgUrl }) => {
        const imgName = window.electron.path.basename(imgUrl);
        const outputPath = window.electron.path.join(outputDir, imgName);
        dispatch(startDownloadingImage({ uri: imgUrl, name: imgName, outputPath }));

        const { error } = await window.electron.downloadSingleImage({ imgUrl, outputPath });
        if (error) {
            console.error(error);
            dispatch(doneDownloadingImage({ name: imgName, status: DOWNLOAD_STATUS.ERROR }));
            return;
        }

        dispatch(doneDownloadingImage({ name: imgName, status: DOWNLOAD_STATUS.SUCCESS }));
    };

    for (; ;) {
        console.log(`Fetching ${albumId} ${valueMax}`);
        const res = await axios.get(albumUrl, { params: { [pageKey]: valueMax } });
        const images = $($.parseHTML(res.data)).find(imgSelector);

        if (images.length === 0) {
            break;
        }

        images.each((_, img) => {
            const imgUrl = img.src.replace(imageSizeRegex, 'photo/xl/public');
            imagesPromises.push(downloadImage({ imgUrl }));
            valueMax += 1;
        });
    }

    console.log(`Waiting all downloads finished`);
    await Promise.all(imagesPromises);
    dispatch(doneAllDownloads());
};

export const retryFailedImages = () => (
    async function (dispatch, getState) {
        const { images, imagesIds } = getState().downloads;

        const failedImages = imagesIds.filter(name => images[name].status === DOWNLOAD_STATUS.ERROR).map(name => images[name]);

        dispatch({ type: RETRY_FAILED_DOWNLOAD });

        const downloadImage = async ({ uri, name, outputPath }) => {
            const { error } = await window.electron.downloadSingleImage({ imgUrl: uri, outputPath });
            if (error) {
                console.error(error);
                dispatch(doneDownloadingImage({ name, status: DOWNLOAD_STATUS.ERROR }));
                return;
            }

            dispatch(doneDownloadingImage({ name, status: DOWNLOAD_STATUS.SUCCESS }));
        };

        const imagesPromises = failedImages.map(downloadImage);


        console.log(`Waiting all downloads finished`);
        await Promise.all(imagesPromises);
        dispatch(doneAllDownloads());
    }
);
