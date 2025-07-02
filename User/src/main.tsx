import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Privacy: Prevent right-click, text selection, and inspect shortcuts
// document.addEventListener('contextmenu', e => e.preventDefault());
// document.addEventListener('selectstart', e => e.preventDefault());
// document.addEventListener('keydown', e => {
//   // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
//   if (
//     e.key === 'F12' ||
//     (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
//     (e.ctrlKey && e.key.toLowerCase() === 'u')
//   ) {
//     e.preventDefault();
//     e.stopPropagation();
//   }
// });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
