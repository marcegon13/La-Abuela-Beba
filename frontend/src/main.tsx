import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Limpiar posibles Service Workers antiguos (evita errores de consola por Caché)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
