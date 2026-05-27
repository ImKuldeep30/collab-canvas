import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Sparkles, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

const Forget = () => {
  const navigate = useNavigate();

  const [email, setemail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (isSubmitted) return;
    const BACKEND_URL = "http://192.168.1.10:3000/api/auth/forgot-password";
    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setIsSubmitted(true);
        setMessage(
          "If this email exists, a password reset link has been sent.",
        );
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 5000);
      } else {
        setIsError(true);
        setIsSubmitted(true);
        setMessage(
          "If this email exists, a password reset link has been sent.",
        );
      }
    } catch (err) {
      setIsError(true);
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#0a0a0c] px-4 relative overflow-hidden">
      
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#121214]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.6),_0_0_0_1px_rgba(255,255,255,0.03)] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 mb-3 cursor-pointer group" onClick={() => navigate('/')}>
            {/* Elegant 3D isometric cube logo */}
            <svg className="w-full h-full" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="forget-face-top" x1="16" y1="3" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="forget-face-left" x1="5" y1="16" x2="16" y2="29" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="forget-face-right" x1="16" y1="16" x2="27" y2="22.5" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#db2777" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <g className="transform origin-center transition-all duration-700 ease-out group-hover:rotate-[360deg] group-hover:scale-105">
                <path d="M16 3L27 9.5L16 16L5 9.5Z" fill="url(#forget-face-top)" />
                <path d="M5 9.5L16 16V29L5 22.5Z" fill="url(#forget-face-left)" />
                <path d="M27 9.5L16 16V29L27 22.5Z" fill="url(#forget-face-right)" />
                <path d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5Z" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" opacity="0.3" />
                <path d="M16 16L5 9.5M16 16L27 9.5M16 16V29" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" opacity="0.3" />
              </g>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Reset Password</h1>
          <p className="text-xs text-gray-400 mt-2 text-center flex items-center gap-1 justify-center max-w-[280px]">
            <Sparkles size={12} className="text-indigo-400 shrink-0" />
            Enter your email to receive a password reset link
          </p>
        </div>

        {message && (
          <div className={`flex items-center p-3 rounded-xl mb-5 text-xs font-semibold gap-2 border ${
            isError 
              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          }`}>
            {isError ? <AlertCircle size={14} className="shrink-0" /> : <CheckCircle size={14} className="shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5 ml-1">
              <Mail size={12} className="text-indigo-400" />
              Email Address
            </label>
            <input 
              value={email} 
              type="email"
              onChange={(e) => setemail(e.target.value)}
              placeholder="name@company.com" 
              required
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm shadow-inner"
            />
          </div>

          <button 
            type="submit"
            disabled={loading || isSubmitted}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer text-sm mt-3"
          >
            {loading ? "Sending..." : isSubmitted ? "Link Sent ✓" : "Send Reset Link"}
          </button>

          <div className="text-center text-xs text-gray-400 pt-3 border-t border-white/5 mt-5">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors"
            >
              <ArrowLeft size={12} />
              Back to Log In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Forget;
