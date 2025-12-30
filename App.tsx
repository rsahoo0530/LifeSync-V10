
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { Tasks } from './pages/Tasks';
import { Journal } from './pages/Journal';
import { Calendar } from './pages/Calendar';
import { ProofWall } from './pages/ProofWall';
import { Analytics } from './pages/Analytics';
import { Insights } from './pages/Insights';
import { Todos } from './pages/Todos';
import { Expenses } from './pages/Expenses';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Challenges } from './pages/Challenges';

const AppRoutes = () => {
  const { user } = useApp();

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/proof-wall" element={<ProofWall />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
