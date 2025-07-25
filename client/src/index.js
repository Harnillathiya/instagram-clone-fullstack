import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// In development, React.StrictMode causes components to mount twice
// which can lead to duplicate socket connections
// For production, you can re-enable StrictMode
const isDevelopment = process.env.NODE_ENV === 'development';

root.render(
  isDevelopment ? <App /> : <React.StrictMode><App /></React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
