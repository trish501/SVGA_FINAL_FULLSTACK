import React from "react";
import { motion } from "motion/react";

export function Sponsors() {
  const placeholders = Array.from({ length: 8 });

  return (
    <section id="sponsors" className="py-24 bg-slate-50/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">
            Trusted By Our Future Partners
          </h2>
          <p className="text-3xl md:text-4xl font-bold text-slate-800">
            Our Generous Sponsors
          </p>
        </motion.div>

        <div className="relative w-full overflow-hidden mask-image-linear-gradient">
          <motion.div 
            className="flex gap-6 md:gap-8 min-w-max hover:[animation-play-state:paused]"
            animate={{ x: [0, -1000] }}
            transition={{ 
              repeat: Infinity, 
              ease: "linear", 
              duration: 30 
            }}
          >
            {[...placeholders, ...placeholders].map((_, index) => (
              <div
                key={index}
                className="w-40 md:w-48 aspect-[3/2] rounded-2xl bg-white/80 backdrop-blur-md border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-blue-100 shrink-0 hover-card"
              >
                <div className="w-16 h-1 bg-slate-200 rounded-full opacity-50" />
              </div>
            ))}
          </motion.div>
        </div>
        
        <div className="mt-16 flex justify-center">
          <button className="text-slate-500 hover:text-blue-600 font-medium transition-colors border-b border-transparent hover:border-blue-200 pb-0.5 active:scale-95 duration-150">
            Become a sponsor
          </button>
        </div>
      </div>
    </section>
  );
}
