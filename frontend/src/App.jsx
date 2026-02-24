import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import QuestionDetail from "./pages/QuestionDetail";
import NotFound from "./pages/NotFound";
import AIChatPage from "./pages/AIChatPage";
import Discuss from "./pages/Discuss";
import Contest from "./pages/Contest";
import Contribute from "./pages/Contribute";

// Auth Components
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Context
import { AuthProvider } from "./context/AuthContext";

import CodeEditor from "./components/CodeEditor";

const LayoutMain = ({ children }) => {
  const location = useLocation();

  // Hide Navbar/Footer on auth pages
  const hideLayout = ["/login", "/register","/", "/forgot-password"].includes(
    location.pathname
  );

  return (
    <>
      {!hideLayout && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <LayoutMain>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<Layout> <Dashboard /></Layout>} />
             <Route path="/problems" element={<Layout><Problems /></Layout>} />
             <Route path="/contest" element={<Layout><Contest /></Layout>} />
             <Route path="/discuss" element={<Layout><Discuss /></Layout>} />
             <Route path="/contribute" element={<Layout><Contribute /></Layout>} />
             <Route path="/ai-chat" element={<AIChatPage />} />
            <Route path="/question/:id" element={<Layout><QuestionDetail /></Layout>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LayoutMain>
      </Router>
    </AuthProvider>
  );
};

export default App;
