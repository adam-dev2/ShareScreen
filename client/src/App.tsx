import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './Pages/HomePage'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/share/:roomId' element={<HomePage />} />
        <Route path='/view/:roomId' element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
