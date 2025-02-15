import React, { useState } from 'react';
import { CodeEditor } from './components/Editor';
import { AuthProvider } from './components/AuthProvider';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './lib/auth';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(!user);

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <CodeEditor />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;