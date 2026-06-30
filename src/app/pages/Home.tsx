import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Sponsors } from "../components/Sponsors";
import { Features } from "../components/Features";
import { Workflow } from "../components/Workflow";
import { Feedback } from "../components/Feedback";
import { Location } from "../components/Location";
import { Footer } from "../components/Footer";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen } from "lucide-react";

export function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 scroll-smooth">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [0.9, 1.05, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white shadow-xl shadow-blue-200"
            >
              <BookOpen size={32} strokeWidth={2.5} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 15 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <Navbar />
        <main>
          <Hero />
          <Sponsors />
          <Features />
          <Workflow />
          <Feedback />
          <Location />
        </main>
        <Footer />
      </motion.div>
    </div>
  );
}
