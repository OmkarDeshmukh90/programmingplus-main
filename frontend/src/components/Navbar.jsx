import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import PillNav from "./PillNav";
import ReactBitsButton from "./ui/ReactBitsButton";
import logo from "../programmingplus-logo.png";

const Navbar = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const navItems = [
    ...(token ? [{ label: "Dashboard", href: "/dashboard" }] : []),
    { label: "Problems", href: "/problems" },
    { label: "Discuss", href: "/discuss" },
    { label: "Contest", href: "/contest" },
    { label: "Contribute", href: "/contribute" },
    ...(token
      ? [{ label: "AI Chat", href: "/ai-chat" }]
      : [
          { label: "Login", href: "/login" },
          { label: "Register", href: "/register" },
        ]),
  ];

  return (
    <div className="fixed top-0 left-0 w-full z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-5 py-3 relative min-h-[82px]">
        <PillNav
          logo={logo}
          logoAlt="Programming+"
          items={navItems}
          activeHref={location.pathname}
          className="!static"
          baseColor="#0f172a"
          pillColor="#22d3ee"
          pillTextColor="#06202a"
          hoveredPillTextColor="#ffffff"
          navHeight="48px"
          logoSize="42px"
          logoWidth="190px"
          pillPaddingX="22px"
          pillGap="8px"
        />

        {token && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden md:block">
            <ReactBitsButton variant="neutral" onClick={handleLogout} className="py-2 px-4">
              Logout
            </ReactBitsButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
