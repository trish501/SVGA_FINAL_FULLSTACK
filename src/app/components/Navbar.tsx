import React, { useState, useEffect } from "react";
import { BookOpen, Menu, X } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Sponsors", href: "#sponsors" },
    { name: "Features", href: "#features" },
    { name: "Workflow", href: "#workflow" },
    { name: "Feedback", href: "#feedback" },
    { name: "Location", href: "#location" },
    { name: "About Us", href: "#about" },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // Navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm border-blue-50/50 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white shadow-md shadow-blue-200"
            >
              <BookOpen size={24} strokeWidth={2.5} />
            </motion.div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-col"
          >
            <span className="text-xl font-bold tracking-tight text-slate-800 leading-none">
              SVGA
            </span>
            <span className="text-sm font-medium text-slate-500">
              Book-Bank
            </span>
          </motion.div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="relative group text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-500 transition-all duration-250 group-hover:w-full rounded-full"></span>
                </a>
              </li>
            ))}
          </ul>
          
          <div className="flex items-center gap-3 ml-4 border-l border-slate-200 pl-6">
            <Link to="/admin-login" className="text-sm font-semibold text-slate-600 px-4 py-2 rounded-lg transition-all hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:-translate-y-0.5 active:scale-95">
              Admin
            </Link>
            <Link to="/student-login" className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-5 py-2.5 rounded-lg shadow-md shadow-blue-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-all active:scale-95">
              Student
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-slate-600 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 p-6 flex flex-col gap-4">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="text-base font-medium text-slate-600 hover:text-blue-600 block"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
            <Link to="/admin-login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 px-4 py-3 rounded-lg bg-slate-50 text-center block">
              Admin Login
            </Link>
            <Link to="/student-login" className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-3 rounded-lg shadow-md text-center block">
              Student Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
