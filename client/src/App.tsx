import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import Sharer from './Pages/Sharer';
import Viewer from './Pages/Viewer';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/share/:roomId" element={<Sharer />} />
        <Route path="/view/:roomId" element={<Viewer />} />
      </Routes>
    </Router>
  );
};

export default App;
