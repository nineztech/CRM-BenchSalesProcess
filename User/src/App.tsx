import { Toaster } from 'react-hot-toast';
import Router from "./routes/AppRouter"
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
