import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RequireRole } from './components/guards/RequireRole.jsx';
import { RequireAuth } from './components/guards/RequireAuth.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AgentPage } from './pages/AgentPage.jsx';
import { BuilderPage } from './pages/BuilderPage.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hyrje" element={<LoginPage />} />
              <Route
                path="/profili"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/agjenti"
                element={
                  <RequireRole roles={['AGENT', 'ADMIN', 'SUPERADMIN']}>
                    <AgentPage />
                  </RequireRole>
                }
              />
              <Route
                path="/ndertuesi"
                element={
                  <RequireRole roles={['SUPERADMIN']}>
                    <BuilderPage />
                  </RequireRole>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}