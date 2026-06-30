import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "SVGA Book Bank saved me so much money this semester. The books were in excellent condition and the registration process was a breeze.",
    name: "Aisha Sharma",
    label: "B.Tech Computer Science, 2nd Year"
  },
  {
    quote: "I couldn't believe it was actually free. The ₹500 deposit was fully refunded exactly when I returned my books. Truly a lifesaver for students!",
    name: "Rahul Desai",
    label: "B.Com, Final Year"
  },
  {
    quote: "The library collection is huge. I found reference books that were otherwise too expensive to buy. Highly recommend every student to join.",
    name: "Priya Patel",
    label: "B.Sc Physics, 1st Year"
  }
];

export function Feedback() {
  return (
    <section id="feedback" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] rounded-full bg-teal-50/40 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-50/40 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-800 mb-6">Student Stories</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Hear from students who have benefited from our community initiative.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((test, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: index * 0.2 }}
              className="h-full"
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ 
                  duration: 6 + Math.random() * 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: index * 1.2
                }}
                className="bg-white/80 backdrop-blur-md border border-slate-100/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-blue-100/50 h-full flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] hover:-translate-y-1 hover:border-blue-100 hover-card"
              >
              <div className="flex gap-1 mb-6 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2 + index
                    }}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </motion.div>
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed flex-grow mb-8 text-lg">
                "{test.quote}"
              </p>
              <div>
                <h4 className="font-bold text-slate-800">{test.name}</h4>
                <p className="text-sm text-slate-500">{test.label}</p>
              </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
