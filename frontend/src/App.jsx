import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import Onboarding from "./pages/Onboarding";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages (lazy loaded)
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Problems = lazy(() => import("./pages/Problems"));
const QuestionDetail = lazy(() => import("./pages/QuestionDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIChatPage = lazy(() => import("./pages/AIChatPage"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Discuss = lazy(() => import("./pages/Discuss"));
const Contest = lazy(() => import("./pages/Contest"));
const Contribute = lazy(() => import("./pages/Contribute"));
const Profile = lazy(() => import("./pages/Profile"));
const CompanyCandidates = lazy(() => import("./pages/CompanyCandidates"));
const CompanySettings = lazy(() => import("./pages/CompanySettings"));
const LearningPath = lazy(() => import("./pages/LearningPath"));
const LiveInterviews = lazy(() => import("./pages/LiveInterviews"));
const InterviewRoom = lazy(() => import("./pages/InterviewRoom"));

const LayoutMain = ({ children }) => {
  const location = useLocation();

  // Hide Navbar/Footer on auth and interview room pages
  const hideLayout = ["/login", "/register", "/onboarding"].includes(
    location.pathname
  ) || location.pathname.startsWith("/interview/room");

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
          <Suspense fallback={<div className="app-page flex items-center justify-center p-8 text-slate-300">Loading...</div>}>
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login/*" element={<div className="app-page flex items-center justify-center p-4"><SignIn routing="path" path="/login" signUpUrl="/register" fallbackRedirectUrl="/onboarding" /></div>} />
              <Route path="/register/*" element={<div className="app-page flex items-center justify-center p-4"><SignUp routing="path" path="/register" signInUrl="/login" fallbackRedirectUrl="/onboarding" /></div>} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<Layout> <Dashboard /></Layout>} />
              <Route path="/problems" element={<Layout><Problems /></Layout>} />
              <Route path="/contest" element={<Layout><Contest /></Layout>} />
              <Route path="/discuss" element={<Layout><Discuss /></Layout>} />
              <Route path="/contribute" element={<Layout><Contribute /></Layout>} />
              <Route path="/ai-chat" element={<AIChatPage />} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/candidates" element={<Layout><CompanyCandidates /></Layout>} />
              <Route path="/settings" element={<Layout><CompanySettings /></Layout>} />
              <Route path="/learning-path" element={<Layout><LearningPath /></Layout>} />
              <Route path="/question/:id" element={<Layout><QuestionDetail /></Layout>} />
              <Route path="/live-interviews" element={<Layout><LiveInterviews /></Layout>} />
              <Route path="/interview/room/:roomToken" element={<InterviewRoom />} />
              <Route path="/analytics" element={<Analytics />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
          </Suspense>
        </LayoutMain>
      </Router>
    </AuthProvider>
  );
};

export default App;
