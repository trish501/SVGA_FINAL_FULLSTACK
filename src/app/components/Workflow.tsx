import React from "react";
import { motion } from "motion/react";
import { MonitorSmartphone, Wallet, BookMarked, Smile } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: <MonitorSmartphone className="w-6 h-6" />,
    title: "Register Online",
    desc: "Create your student profile in minutes."
  },
  {
    num: "02",
    icon: <Wallet className="w-6 h-6" />,
    title: "Pay Deposit",
    desc: "A fully refundable ₹500 security deposit."
  },
  {
    num: "03",
    icon: <BookMarked className="w-6 h-6" />,
    title: "Pick Books",
    desc: "Select the books you need for your semester."
  },
  {
    num: "04",
    icon: <Smile className="w-6 h-6" />,
    title: "Collect & Enjoy",
    desc: "Pick them up from our location and study!"
  }
];

export function Workflow() {
  return (
    <section id="workflow" className="py-24 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-bold text-slate-800 mb-6">How It Works</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A simple, transparent four-step process to get your study materials without any hassle.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[4.5rem] left-[10%] right-[10%] h-[2px] bg-slate-100 overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              whileInView={{ x: "0%" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300"
            />
          </div>

          <div className="grid md:grid-cols-4 gap-12 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative flex flex-col items-center text-center group hover-card"
              >
                {/* Number Badge */}
                <div className="absolute -top-4 -right-2 text-6xl font-black text-slate-100/60 group-hover:text-blue-50 transition-colors duration-500 z-0 select-none">
                  {step.num}
                </div>

                {/* Icon Circle */}
                <motion.div 
                  whileInView={{ scale: [1, 1.05, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  className="relative z-10 w-20 h-20 rounded-full bg-white/80 backdrop-blur-md border border-slate-100 flex items-center justify-center text-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] group-hover:border-blue-100"
                >
                  {step.icon}
                </motion.div>

                <h3 className="text-xl font-bold text-slate-800 mb-3 relative z-10">{step.title}</h3>
                <p className="text-slate-600 relative z-10">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
