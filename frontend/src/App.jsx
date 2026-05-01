import { Routes, Route, Navigate } from 'react-router';
import { Dashboard } from './pages/dashboard';
import { LandingPage } from './pages/LandingPage';
import { ApiAnalysisPage } from './pages/ApiAnalysisPage';
import { OpenApiFromCurlPage } from './pages/OpenApiFromCurlPage';
import { EndpointDataGuidePage } from './pages/EndpointDataGuidePage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Parent path /tools so the layout index does not match "/" and skip the landing page */}
      <Route path="/tools" element={<Dashboard />}>
        <Route index element={<Navigate to="api-analysis" replace />} />
        <Route path="api-analysis" element={<ApiAnalysisPage />} />
        <Route path="openapi-from-curl" element={<OpenApiFromCurlPage />} />
        <Route path="openapi-endpoint-guide" element={<EndpointDataGuidePage />} />
      </Route>

      <Route path="/api-analysis" element={<Navigate to="/tools/api-analysis" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
