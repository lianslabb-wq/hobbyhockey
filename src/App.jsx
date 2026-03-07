import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import TeamDashboard from './pages/TeamDashboard'
import GoalieDashboard from './pages/GoalieDashboard'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team" element={<TeamDashboard />} />
        <Route path="/goalie" element={<GoalieDashboard />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  )
}
