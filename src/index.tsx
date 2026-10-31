/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

import {store} from './store/store';
import {Provider} from 'react-redux';

if (__E2E_EMULATORS__) {
  void import('./firebase/e2eHooks').then(({installE2EHooks}) => installE2EHooks());
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);

  root.render(
    <Provider store={store}>
      <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <App/>
      </BrowserRouter>
    </Provider>,
  );
} else {
  throw new Error(
    'Root element with ID \'root\' was not found in the document',
  );
}
