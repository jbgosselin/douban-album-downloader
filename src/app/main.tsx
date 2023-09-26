import 'bootstrap/dist/css/bootstrap.min.css';
import * as React from 'react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';

import Application from './app';
import store from './store';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <Provider store={store}>
        <Application />
    </Provider>
);
