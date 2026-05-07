import React from 'react';
import AppRouter from './router/AppRouter';
import ToastContainer from './components/common/Toast';
import Chatbot from './components/common/Chatbot';
import { useAuthStore } from './store/authStore';

const App = () => {
  const { user } = useAuthStore();
  
  return (
    <>
      <AppRouter />
      <ToastContainer />
      {user && <Chatbot />}
    </>
  );
};

export default App;
