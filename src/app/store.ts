import { configureStore } from '@reduxjs/toolkit'
import downloadReducer from './features/downloads/downloadsSlice';

const store = configureStore({
    reducer: {
        downloads: downloadReducer,
    },
});

export default store;