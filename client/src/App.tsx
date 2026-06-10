import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './Pages/HomePage';
import Sharer from '../src/Pages/Sharer.tsx';
import Viewer from '../src/Pages/Viewer.tsx'
import { socket } from '../src/utils/socket.ts'
const App = () => {
  socket
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/share/:roomId' element={<Sharer />} />
        <Route path='/view/:roomId' element={<Viewer />} />
      </Routes>
    </Router>
  )
}

export default App
