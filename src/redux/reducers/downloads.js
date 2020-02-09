import {
    START_DOWNLOADING_IMAGE, DONE_DOWNLOADING_IMAGE, DONE_ALL_DOWNLOADS,
    RETRY_FAILED_DOWNLOAD,
} from "../actionTypes";

import { DOWNLOAD_STATUS } from '../../constants';

const initialState = {
    done: false,
    imagesIds: [],
    images: {},
};

export default function (state = initialState, action) {
    switch (action.type) {
        case START_DOWNLOADING_IMAGE: {
            const { name, uri, outputPath } = action;
            return {
                ...state,
                imagesIds: [...state.imagesIds, name],
                images: {
                    ...state.images,
                    [name]: {
                        name,
                        status: DOWNLOAD_STATUS.PENDING,
                        uri,
                        outputPath,
                    },
                }
            };
        }
        case DONE_DOWNLOADING_IMAGE: {
            const { name, status } = action;
            return {
                ...state,
                images: {
                    ...state.images,
                    [name]: {
                        ...state.images[name],
                        status,
                    },
                }
            };
        }
        case DONE_ALL_DOWNLOADS: {
            return {
                ...state,
                done: true,
            };
        }
        case RETRY_FAILED_DOWNLOAD: {
            const images = {};
            for (const [name, img] of Object.entries(state.images)) {
                if (img.status !== DOWNLOAD_STATUS.ERROR) {
                    images[name] = img;
                    continue;
                }
                images[name] = {
                    ...img,
                    status: DOWNLOAD_STATUS.PENDING,
                };
            }
            return {
                ...state,
                images,
                done: false,
            };
        }
        default:
            return state;
    }
}
