import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import Playground from './Playground';
// import RealDataTest from './RealDataTest';

// React 18's createRoot API, replacing the old ReactDOM.render call.
// (You were already on react-dom 18 after the last upgrade, so this
// was due regardless of the Vite move - render() still works but is
// deprecated and prints a console warning.)
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// The old CRA template registered/unregistered a service worker here
// (serviceWorker.js). Your code only ever called .unregister(), which
// is a no-op unless one was previously installed - so it's safe to
// just drop entirely. If you want offline/PWA support later, Vite's
// equivalent is the `vite-plugin-pwa` package, not this file.
