import react from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Events from "./pages/Events"
import EventView from "./pages/EventView"
import CreateEvent from "./pages/CreateEvent"
import EditEvent from "./pages/EditEvent"
import EventRegistrations from "./pages/EventRegistrations"
import CreateJob from "./pages/CreateJob"
import JobManagement from "./pages/JobManagement"
import CreateCampaign from "./pages/CreateCampaign"
import Dashboard from "./pages/Dashboard"
import UserManagement from "./pages/UserManagement"
import EventManagement from "./pages/EventManagement"
import CreateContent from "./pages/CreateContent"
import ContentManagement from "./pages/ContentManagement"
import Stories from "./pages/Stories"
import ArticleView from "./pages/ArticleView"
import Error from "./pages/Error"
import Profile from "./pages/Profile"
import AdminProtectedRoute from "./components/AdminProtectedRoute"
import ProtectedRoute from "./components/ProtectedRoute"
import ScrollToTop from "./components/ScrollToTop"
import AutoLogout from "./components/AutoLogout"
import { NotificationProvider } from './Hooks/NotificationContext';

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
    <NotificationProvider>
    <BrowserRouter>
      <ScrollToTop />
      <AutoLogout />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<ArticleView />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventView />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="/dashboard" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
        <Route path="/dashboard/users" element={<AdminProtectedRoute><UserManagement /></AdminProtectedRoute>} />
        <Route path="/dashboard/events" element={<AdminProtectedRoute><EventManagement /></AdminProtectedRoute>} />
        <Route path="/dashboard/events/edit/:id" element={<AdminProtectedRoute><EditEvent /></AdminProtectedRoute>} />
        <Route path="/dashboard/events/registrations" element={<AdminProtectedRoute><EventRegistrations /></AdminProtectedRoute>} />
        <Route path="/dashboard/jobs/create" element={<AdminProtectedRoute><CreateJob /></AdminProtectedRoute>} />
        <Route path="/dashboard/jobs" element={<AdminProtectedRoute><JobManagement /></AdminProtectedRoute>} />
        <Route path="/dashboard/donations/create" element={<AdminProtectedRoute><CreateCampaign /></AdminProtectedRoute>} />
        <Route path="/dashboard/content" element={<AdminProtectedRoute><ContentManagement /></AdminProtectedRoute>} />
        <Route path="/dashboard/content/create" element={<AdminProtectedRoute><CreateContent /></AdminProtectedRoute>} />
        <Route path="/dashboard/content/edit/:id" element={<AdminProtectedRoute><CreateContent /></AdminProtectedRoute>} />
        <Route path="/dashboard-preview" element={<Dashboard />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </BrowserRouter>
    </NotificationProvider>
  )
}

export default App