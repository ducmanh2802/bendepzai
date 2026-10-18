import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './services/pwa';

createRoot(document.getElementById('root')!).render(<App />);

// Offline / installable support. Non-fatal by design: if the browser refuses
// registration the app simply behaves like it always did.
registerServiceWorker();