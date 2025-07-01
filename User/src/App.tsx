import { Toaster } from 'react-hot-toast';
import AppRouter from './Routes/AppRouter.tsx';
import './App.css';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AppRouter />
    </>
  );
}

export default App;
