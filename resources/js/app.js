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
        React.createElement(
            React.StrictMode,
            null,
            React.createElement(
                BrowserRouter,
                null,
                React.createElement(MainApp, null)
            )
        )
    );
}
