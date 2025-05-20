import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 50,
    transition: "all 0.3s ease",
    backgroundColor: scrolled ? "rgba(255, 255, 255, 0.9)" : "nottransparent",
    backdropFilter: scrolled ? "blur(10px)" : "none",
    boxShadow: scrolled ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "112rem", // roughly max-w-7xl
    margin: "0 auto",
    padding: "0 1rem",
  };

  const flexStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    height: "4rem", // 16 * 0.25rem
  };

  const logoStyle: React.CSSProperties = {
    height: "2.5rem", // 10 * 0.25rem
    width: "auto",
    objectFit: "contain",
    marginLeft:"1rem"
  };

  const linkStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <div style={flexStyle}>
          <Link to="/" style={linkStyle}>
            <img src=".\Logo.webp" alt="Logo" style={logoStyle} />
             
             </Link>
        </div>
      </div>
    </nav>
  );
};
