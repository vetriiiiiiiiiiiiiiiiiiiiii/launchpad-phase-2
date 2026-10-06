import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { loadContent } from './lib/content.js';
import './styles/site.css';
import './styles/launches.css';
import './styles/react.css';

// content first, then the app: sections read the saved photos as they load
loadContent().then(async () => {
  const { default: App } = await import('./App.jsx');
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
});
