
import React, { useContext } from 'react';
import LoginScreen from './components/LoginScreen';
import AuthenticatedApp from './components/AuthenticatedApp';
import { AuthContext } from './context/AuthContext';

function App() {
  const auth = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {auth?.user ? <AuthenticatedApp /> : <LoginScreen />}
    </div>
  );
}

export default App;