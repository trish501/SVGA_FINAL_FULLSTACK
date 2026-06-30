import React from "react";
import { motion } from "motion/react";

export function Hero() {
  return (
    <section 
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-12 overflow-hidden bg-white"
    >
      {/* Background Pastel Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl opacity-70" 
        />
        <motion.div 
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full bg-teal-50/60 blur-3xl opacity-70" 
        />
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.6, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-100/40 blur-3xl opacity-60" 
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
        <div className="flex flex-col items-center">
          {/* Subtle badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-8 border border-blue-100/50 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Welcome to SVGA
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-8"
          >
            SVGA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Book Bank</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-6 font-medium"
          >
            Get free books for your studies — register, pay a refundable ₹500 deposit, and take home any books you want.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="inline-block bg-white/60 backdrop-blur-sm border border-slate-100 px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-blue-50/50"
          >
            <p className="text-lg md:text-xl text-slate-700 font-semibold flex items-center gap-2">
              <span className="text-emerald-500">✨</span>
              ₹500 will be fully refunded when you return your books.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
