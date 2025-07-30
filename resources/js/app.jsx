import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import MainApp from './MainApp.jsx';

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <BrowserRouter 
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                }}
            >
                <MainApp />
            </BrowserRouter>
        </React.StrictMode>
    );
}
