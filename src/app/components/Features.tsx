import React from "react";
import { motion } from "motion/react";
import { Library, UserCheck, Clock, Layers } from "lucide-react";

const features = [
  {
    icon: <Library className="w-6 h-6 text-blue-500" />,
    title: "2000+ Books Available",
    description: "Access a massive library covering multiple disciplines, completely free to borrow for your academic needs."
  },
  {
    icon: <UserCheck className="w-6 h-6 text-teal-500" />,
    title: "Free for All Students",
    description: "Equal access for everyone. No hidden fees or rental charges, just a small refundable deposit."
  },
  {
    icon: <Clock className="w-6 h-6 text-cyan-500" />,
    title: "Easy & Quick Process",
    description: "Register online, pick your books, and collect them without long queues or tedious paperwork."
  },
  {
    icon: <Layers className="w-6 h-6 text-indigo-500" />,
    title: "Multiple Streams",
    description: "Whether you're in Engineering, Commerce, Arts, or Science, we have resources tailored for you."
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-white">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-4xl font-bold text-slate-800 mb-6">Why Choose SVGA Book Bank?</h2>
          <p className="text-lg text-slate-600">
            We are dedicated to making education accessible. Explore the benefits of joining our student community.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="bg-white/70 backdrop-blur-md border border-slate-100/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] hover:-translate-y-1 hover:border-blue-100 transition-all duration-300 group overflow-hidden relative hover-card"
            >
              {/* Shine sweep effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
              
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-blue-50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
