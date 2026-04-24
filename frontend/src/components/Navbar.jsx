import React, { useContext, useState, lazy, Suspense, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "../programmingplus-logo.png";

const PillNav = lazy(() => import("./PillNav"));

const Navbar = () => {
  const { token, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isCompany = role === "company";

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const publicNavItems = [
    { label: "Home", href: "/" },
    { label: "Practice", href: "/problems" },
    { label: "Contests", href: "/contest" },
    { label: "Visualize", href: "/visualize" },
    { label: "Login", href: "/login" },
    { label: "Signup", href: "/register" },
  ];

  const candidateNavItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Practice", href: "/problems" },
    { label: "Contests", href: "/contest" },
    { label: "Visualize", href: "/visualize" },
    { label: "Interviews", href: "/live-interviews" },
    { label: "Discuss", href: "/discuss" },
    { label: "AI", href: "/ai-chat" },
    { label: "Profile", href: "/profile" },
  ];

  const companyNavItems = [
    { label: "Overview", href: "/dashboard" },
    { label: "Contests", href: "/contest?tab=company" },
    { label: "Candidates", href: "/candidates" },
    { label: "Live Interviews", href: "/live-interviews" },
    { label: "Settings", href: "/settings" },
  ];

  let navItems = token ? (isCompany ? companyNavItems : candidateNavItems) : publicNavItems;

  const isLanding = location.pathname === "/";

  if (isLanding) {
    return (
      <div className={`fixed top-0 left-0 w-full z-50 pointer-events-none transition-all duration-500 ${isScrolled ? "h-[50px] md:h-[60px] bg-transparent border-transparent" : "h-24"}`}>
        <div
          className={`absolute transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto cursor-pointer rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#050505]/40 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]
            ${isScrolled
              ? "left-2 md:left-4 top-2 p-1.5 scale-75 md:scale-[0.65] origin-top-left"
              : "left-1/2 -translate-x-1/2 top-6 p-2 scale-100"
            }`}
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="Programming+" className="w-auto h-[40px] md:h-[56px] block rounded-xl md:rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-full z-50 border-b border-[rgba(255,255,255,0.08)] bg-[#050505]/85 backdrop-blur-md">
      <div className="w-full mx-auto px-4 md:px-8 py-3 relative min-h-[70px] md:min-h-[82px] flex items-center justify-between">

        {/* Logo */}
        <div className="flex-shrink-0 flex items-center cursor-pointer relative z-[1001]" onClick={() => navigate("/")}>
          <img src={logo} alt="Programming+" className="w-auto h-[40px] md:h-[56px] block rounded-xl md:rounded-2xl" />
        </div>

        {/* Navigation — PillNav handles its own responsive hamburger */}
        <div className="flex-1 flex justify-end items-center relative z-[1000]">
          <Suspense fallback={<div className="h-12 w-32" />}>
            <PillNav
              items={navItems}
              activeHref={location.pathname}
              className=""
              baseColor="#0a0a0a"
              pillColor="var(--accent)"
              pillTextColor="#ffffff"
              hoveredPillTextColor="#ffffff"
              navHeight="48px"
              pillPaddingX="22px"
              pillGap="8px"
            />
          </Suspense>
        </div>

      </div>
    </div>
  );
};

export default Navbar;

