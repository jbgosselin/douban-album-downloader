import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export enum DownloadStatus {
    Pending = "PENDING",
    Error = "ERROR",
    Success = "SUCCESS",
}

export type Image = {
    name: string;
    status: DownloadStatus;
    uri: string;
    outputPath: string;
}

type State = {
    done: boolean;
    imagesIds: string[];
    images: {
        [name: string]: Image;
    }
}

export const retryFailedImages = createAsyncThunk<void, void, {state: {downloads: State}}>(
    'downloads/retryFailedImages',
    async (_, { getState, dispatch }) => {
        const { images, imagesIds } = getState().downloads;

        const failedImages = imagesIds.filter(name => images[name].status === DownloadStatus.Error).map(name => images[name]);

        dispatch(retryFailedDownloads());

        const downloadImage = async ({ uri, name, outputPath }: Image) => {
            const { error } = await window.electron.downloadSingleImage({ imgUrl: uri, outputPath });
            if (error) {
                console.error(error);
                dispatch(doneDownloadingImage({ name, status: DownloadStatus.Error }));
                return;
            }

            dispatch(doneDownloadingImage({ name, status: DownloadStatus.Success }));
        };

        const imagesPromises = failedImages.map(downloadImage);

        console.log(`Waiting all downloads finished`);
        await Promise.all(imagesPromises);
        dispatch(doneAllDownloads());
    }
);

type Album = {
    albumId: string,
    albumUrl: string,
    imgSelector: string,
    pageKey: string,
}

const imageSizeRegex = /photo\/\w+\/public/;

export const startDownloadAlbum = createAsyncThunk(
    'downloads/startDownloadAlbum',
    async ({ albumId, albumUrl, pageKey, imgSelector }: Album, { dispatch }) => {
        const { outputDir, canceled } = await window.electron.createOutputDirectory({
            dirName: albumId,
        });
        
        if (canceled === true) {
            return;
        }
        
        // dispatch(startDownloadingAlbum()); change to download list
        
        let valueMax = 0;
        const imagesPromises: Promise<void>[] = [];
        
        const downloadImage = async ({ imgUrl }: { imgUrl: string }) => {
            const imgName = window.electron.path.basename(imgUrl);
            const outputPath = window.electron.path.join(outputDir, imgName);
            dispatch(startDownloadingImage({ uri: imgUrl, name: imgName, outputPath }));
            
            const { error } = await window.electron.downloadSingleImage({ imgUrl, outputPath });
            if (error) {
                console.error(error);
                dispatch(doneDownloadingImage({ name: imgName, status: DownloadStatus.Error }));
                return;
            }
            
            dispatch(doneDownloadingImage({ name: imgName, status: DownloadStatus.Success }));
        };

        for (; ;) {
            console.log(`Fetching ${albumId} ${valueMax}`);
            const res = await axios.get(albumUrl, { params: { [pageKey]: valueMax } });
            const parser = new DOMParser();
            const doc = parser.parseFromString(res.data, 'text/html');
            const images = doc.querySelectorAll(imgSelector) as NodeListOf<HTMLImageElement>;

            if (images.length === 0) {
                break;
            }

            for (const img of images) {
                const imgUrl = img.src.replace(imageSizeRegex, 'photo/xl/public');
                imagesPromises.push(downloadImage({ imgUrl }));
                valueMax += 1;
            }
        }
    
        console.log(`Waiting all downloads finished`);
        await Promise.all(imagesPromises);
        dispatch(doneAllDownloads());
    }
);

const initialState: State = {
    done: false,
    imagesIds: [],
    images: {},
};

export const slice = createSlice({
    name: 'downloads',
    initialState,
    reducers: {
        startDownloadingImage: (state, action) => {
            const { name, uri, outputPath } = action.payload;
            state.imagesIds.push(name);
            state.images[name] = {
                name,
                status: DownloadStatus.Pending,
                uri,
                outputPath,
            };
        },
        doneDownloadingImage: (state, action) => {
            const { name, status } = action.payload;
            state.images[name].status = status;
        },
        doneAllDownloads: (state) => {
            state.done = true;
        },
        retryFailedDownloads: (state) => {
            for (const [name, img] of Object.entries(state.images)) {
                if (img.status !== DownloadStatus.Error) {
                    continue;
                }
                state.images[name].status = DownloadStatus.Pending;
            }
            state.done = false;
        },
    }
});

export const { startDownloadingImage, doneDownloadingImage, doneAllDownloads, retryFailedDownloads } = slice.actions;

export const selectImages = (state: {downloads: State}) => ({
    images: state.downloads.images,
    imagesIds: state.downloads.imagesIds,
});
export const selectDone = (state: {downloads: State}) => state.downloads.done;

export default slice.reducer;
