import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import DemoHub from './pages/DemoHub.jsx';
import CompanyRoute from './routes/CompanyRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DemoHub />} />
      <Route path="/:companyId/*" element={<CompanyRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
