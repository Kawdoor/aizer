import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/toast/Toast';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const { user, loading, authError, signOut } = useAuth();
  const [sessionExpired, setSessionExpired] = useState(false);

  // Handle authentication errors
  useEffect(() => {
    if (authError) {
      console.error("Auth error detected:", authError);
      
      // Check for token expiration or invalid token errors
      if (
        authError.message?.includes("Invalid Refresh Token") ||
        authError.message?.includes("JWT expired") ||
        authError.message?.includes("JWT invalid")
      ) {
        console.log("Session expired, showing message");
        setSessionExpired(true);
      }
    } else {
      setSessionExpired(false);
    }
  }, [authError]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setSessionExpired(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-thin text-lg tracking-wider">AIZER</div>
      </div>
    );
  }

  if (sessionExpired && user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 max-w-md w-full">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="text-yellow-500 w-6 h-6" />
            <h2 className="text-white text-lg font-light">Sesión Expirada</h2>
          </div>
          <p className="text-gray-300 mb-6">
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full bg-white text-black py-3 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors"
          >
            INICIAR SESIÓN NUEVAMENTE
          </button>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginForm />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;