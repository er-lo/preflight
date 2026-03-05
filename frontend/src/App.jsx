import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { Dashboard } from './pages/dashboard'
import { SubmitPage } from './pages/submitPage'
import { ResultPage } from './pages/resultPage'
import { Container } from '@mui/material'
import './App.css'

function App() {
  return (
    <Routes>
      {/* Dashboard is the layout, child routes render inside its <Outlet /> */}
      <Route element={<Dashboard />}>
        <Route index element={<SubmitPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/results" element={<ResultPage />} />
      </Route>
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App