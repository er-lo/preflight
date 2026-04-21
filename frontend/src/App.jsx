import { Routes, Route, Navigate } from 'react-router';
import { Dashboard } from './pages/dashboard';
import { ApiAnalysisPage } from './pages/ApiAnalysisPage';
import { OpenApiFromCurlPage } from './pages/OpenApiFromCurlPage';
import { EndpointDataGuidePage } from './pages/EndpointDataGuidePage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route element={<Dashboard />}>
        <Route index element={<Navigate to="/tools/api-analysis" replace />} />
        <Route path="/tools/api-analysis" element={<ApiAnalysisPage />} />
        <Route path="/tools/openapi-from-curl" element={<OpenApiFromCurlPage />} />
        <Route path="/tools/openapi-endpoint-guide" element={<EndpointDataGuidePage />} />
        <Route path="/api-analysis" element={<Navigate to="/tools/api-analysis" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/tools/api-analysis" replace />} />
    </Routes>
  );
}

export default App;
