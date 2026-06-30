import React from "react";
import { motion } from "motion/react";
import { MapPin, Clock, Navigation } from "lucide-react";

export function Location() {
  return (
    <section id="location" className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-800 mb-6">Visit Our Book Bank</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find us easily. Drop by to register, pick up your books, or return them at your convenience.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Map Placeholder Area */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-3/5"
          >
            <div className="aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3] rounded-3xl bg-white border border-slate-200 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-blue-100/50 overflow-hidden hover:scale-[1.01] transition-transform duration-500 hover-card">
              <div className="w-full h-full rounded-2xl bg-slate-100 flex flex-col items-center justify-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDIwaDQwTTIwIDB2NDAiIHN0cm9rZT0iI2U1ZTdlYiIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-50" />
                
                <div className="relative z-10 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                  <MapPin size={32} />
                  <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping" />
                </div>
                <p className="relative z-10 mt-4 font-medium text-slate-500 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm text-sm">
                  Interactive Map Integration Zone
                </p>
              </div>
            </div>
          </motion.div>

          {/* Description Block */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-2/5 space-y-8"
          >
            <div className="bg-white/80 backdrop-blur-md border border-slate-100/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-blue-50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300 hover-card">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Our Location</h3>
              
              <ul className="space-y-6">
                <li className="flex gap-4 group cursor-default">
                  <div className="mt-1 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-300">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Address</h4>
                    <p className="text-slate-600 mt-1">SVGA Campus Building, Block B, Ground Floor, Near Student Center.</p>
                  </div>
                </li>
                
                <li className="flex gap-4 group cursor-default">
                  <div className="mt-1 w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 shrink-0 group-hover:bg-teal-100 group-hover:scale-105 transition-all duration-300">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">Working Hours</h4>
                    <p className="text-slate-600 mt-1">Mon - Sat: 9:00 AM - 5:00 PM<br/>Sunday Closed</p>
                  </div>
                </li>
              </ul>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <button className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 duration-150 hover:-translate-y-0.5 hover:brightness-110">
                  <Navigation size={18} />
                  Get Directions
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
