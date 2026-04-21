import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './App.css'

// Pages
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'

// Components
import AppLayout from './components/layout/AppLayout'
import LandingHero from './components/LandingHero'
import LandingFeatures from './components/LandingFeatures'
import ReportView from './components/visualizations/ReportView'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Public Routes - No Authentication Required */}
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/analysis/:id" element={<AnalysisPage />} />
              <Route path="/report/:id" element={<ReportView />} />

              {/* Home Route - Premium Landing Page */}
              <Route path="/" element={
                <>
                  <LandingHero />
                  <LandingFeatures />
                </>
              } />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
