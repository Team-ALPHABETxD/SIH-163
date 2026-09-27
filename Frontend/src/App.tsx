import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Dashboard } from './pages/DashboardPage';
import { Target } from './pages/NewScanPage';
import { AssessmentRunning } from './pages/ScanMonitorPage';
import { Findings } from './pages/FindingsExplorerPage';
import { FindingDetails } from './pages/FindingDetailPage';
import { Modules } from './pages/Modules';
import { Reports } from './pages/ReportBuilderPage';
import { ReportDetails } from './pages/ReportDetails';
import { Settings } from './pages/SettingsPage';
import { AppLayout } from './components/layout/AppLayout';

import { AttackGraphPage } from './pages/AttackGraphPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/target" element={<Target />} />
          <Route path="/assessment/running" element={<AssessmentRunning />} />
          <Route path="/findings" element={<Findings />} />
          <Route path="/findings/:id" element={<FindingDetails />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/modules/:slug" element={<Modules />} />
          <Route path="/graph" element={<AttackGraphPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
