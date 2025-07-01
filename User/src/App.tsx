import { Toaster } from 'react-hot-toast';
import Router from "./Routes/AppRouter"
import './App.css';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router />
    </>
  );
}

export default App;
