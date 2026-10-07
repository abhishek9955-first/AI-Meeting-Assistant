import { useEffect, useState } from 'react'
import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom'
import './App.css'
import Login from './login/Login'
import Register from './register/Register'
import Dashboard from './dashboard/Dashboard'
import Decode from './decode/Decode'
import Meeting from './meeting/Meeting'

function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"))
  const token = localStorage.getItem("accesstoken")
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/decode" element={<ProtectedRoute><Decode /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path='/meeting' element={<ProtectedRoute><Meeting/></ProtectedRoute>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
