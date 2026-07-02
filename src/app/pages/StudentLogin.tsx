import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, CheckCircle2, ChevronRight, LockKeyhole } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

export function StudentLogin() {
  const navigate = useNavigate();
  const { loginStudent } = useAuth();

  // States to track flow
  const [aadhaar, setAadhaar] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  const handleVerifyEmailOTP = () => {
    if (emailOtp.length > 3) setIsEmailVerified(true);
  };

  const handleVerifyMobileOTP = () => {
    if (mobileOtp.length > 3) setIsMobileVerified(true);
  };

  const isFormComplete = aadhaar.length >= 12 && isEmailVerified && isMobileVerified;

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete) {
      loginStudent({ name: email.split("@")[0] || "Student User", email });
      navigate("/student");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#f8faff] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans"
    >
      {/* Decorative dot pattern and soft shapes */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/60 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-100/40 blur-3xl pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-8 relative z-10"
      >
        <Link to="/" className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white shadow-md shadow-blue-200 mb-4 hover:scale-105 transition-transform">
          <BookOpen size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Student Login
        </h1>
        <p className="text-slate-500 font-medium mt-2">Verify your details to get started.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-blue-50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-blue-100/50">
          
          <form className="space-y-6" onSubmit={handleGetStarted}>
            
            {/* Step 1: Aadhaar */}
            <div className="space-y-1.5 relative">
              <label className="text-sm font-semibold text-slate-700 block">Aadhaar Number</label>
              <input 
                type="text" 
                maxLength={12}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                placeholder="1234 5678 9012"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-300 text-slate-700 tracking-wide"
              />
              <p className="text-xs text-slate-400 mt-1">Used securely for student identity verification only.</p>
            </div>

            <div className="w-full h-px bg-slate-100 my-4" />

            {/* Step 2: Email Verification */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                  <span>Email Address</span>
                  {isEmailVerified && <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={14}/> Verified</span>}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailVerified}
                    placeholder="student@college.edu"
                    className={`w-full px-4 py-3 rounded-xl border transition-all placeholder:text-slate-300 ${
                      isEmailVerified 
                        ? "bg-slate-50 border-emerald-200 text-slate-500" 
                        : "border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-slate-700"
                    }`}
                  />
                  {!isEmailVerified && (
                    <button 
                      type="button"
                      onClick={() => setIsEmailOtpSent(true)}
                      disabled={!email.includes('@')}
                      className="px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-sm transition-colors whitespace-nowrap disabled:opacity-50 disabled:hover:bg-blue-50"
                    >
                      Send OTP
                    </button>
                  )}
                </div>
              </div>

              {/* Email OTP Field */}
              <AnimatePresence>
                {isEmailOtpSent && !isEmailVerified && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          placeholder="Enter Email OTP"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-blue-200 bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400 text-slate-700"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleVerifyEmailOTP}
                        disabled={emailOtp.length < 4}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm"
                      >
                        Verify
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full h-px bg-slate-100 my-4" />

            {/* Step 3: Mobile Verification */}
            <div className={`space-y-4 transition-opacity duration-300 ${!isEmailVerified ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                  <span>Mobile Number</span>
                  {isMobileVerified && <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={14}/> Verified</span>}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <span className="absolute left-4 text-slate-500 font-medium">+91</span>
                    <input 
                      type="tel" 
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      disabled={isMobileVerified}
                      placeholder="98765 43210"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all placeholder:text-slate-300 ${
                        isMobileVerified 
                          ? "bg-slate-50 border-emerald-200 text-slate-500" 
                          : "border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-slate-700"
                      }`}
                    />
                  </div>
                  {!isMobileVerified && (
                    <button 
                      type="button"
                      onClick={() => setIsMobileOtpSent(true)}
                      disabled={mobile.length < 10}
                      className="px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-sm transition-colors whitespace-nowrap disabled:opacity-50 disabled:hover:bg-blue-50"
                    >
                      Send OTP
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile OTP Field */}
              <AnimatePresence>
                {isMobileOtpSent && !isMobileVerified && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          placeholder="Enter Mobile OTP"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-blue-200 bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400 text-slate-700"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleVerifyMobileOTP}
                        disabled={mobileOtp.length < 4}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm"
                      >
                        Verify
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Final Submit */}
            <AnimatePresence>
              {isFormComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button 
                    type="submit"
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

        </div>

        <div className="mt-8 text-center">
          <Link to="/admin-login" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Staff Member? Go to Admin Login
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
