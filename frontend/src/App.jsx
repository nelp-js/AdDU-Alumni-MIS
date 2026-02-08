import react from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Events from "./pages/Events"
import EventView from "./pages/EventView"
import CreateEvent from "./pages/CreateEvent"
import Dashboard from "./pages/Dashboard"
import UserManagement from "./pages/UserManagement"
import EventManagement from "./pages/EventManagement"
import Stories from "./pages/Stories"
import Error from "./pages/Error"
import AdminProtectedRoute from "./components/AdminProtectedRoute"
import ScrollToTop from "./components/ScrollToTop"
import AutoLogout from "./components/AutoLogout"
function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      
      <AutoLogout /> 

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventView />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="/dashboard" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
        <Route path="/dashboard/users" element={<AdminProtectedRoute><UserManagement /></AdminProtectedRoute>} />
        <Route path="/dashboard/events" element={<AdminProtectedRoute><EventManagement /></AdminProtectedRoute>} />
        <Route path="/dashboard-preview" element={<Dashboard />} />
        <Route path="*" element={<Error />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App