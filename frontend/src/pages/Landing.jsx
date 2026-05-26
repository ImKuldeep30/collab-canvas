import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Paintbrush, MessageSquare, Users, Shield, ArrowRight, Zap } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const handleTryNow = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white overflow-x-hidden relative flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] bg-pink-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="landing-face-top" x1="16" y1="3" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="landing-face-left" x1="5" y1="16" x2="16" y2="29" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="landing-face-right" x1="16" y1="16" x2="27" y2="22.5" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#db2777" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <g className="transform origin-center transition-all duration-700 ease-out group-hover:rotate-[360deg] group-hover:scale-105">
                <path d="M16 3L27 9.5L16 16L5 9.5Z" fill="url(#landing-face-top)" />
                <path d="M5 9.5L16 16V29L5 22.5Z" fill="url(#landing-face-left)" />
                <path d="M27 9.5L16 16V29L27 22.5Z" fill="url(#landing-face-right)" />
                <path d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5Z" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" opacity="0.3" />
                <path d="M16 16L5 9.5M16 16L27 9.5M16 16V29" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" opacity="0.3" />
              </g>
            </svg>
          </div>
          <span className="text-white font-extrabold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-purple-200">
            CoCanvas
          </span>
        </div>
        
        <button
          onClick={handleTryNow}
          className="px-5 py-2 text-xs font-extrabold rounded-xl text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
        >
          Sign In
        </button>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 flex flex-col justify-center relative z-10 py-12 md:py-20">
        
        {/* Badge Indicator */}
        <div className="flex items-center gap-1.5 self-center md:self-start bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-6 animate-pulse">
          <Zap size={10} className="fill-indigo-400" />
          Next-Gen Collaboration
        </div>

        {/* Hero Headline */}
        <div className="text-center md:text-left space-y-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Realtime Collaborative <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
              Canvas for Modern Teams
            </span>
          </h1>
          
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
            Draw, conceptualize, and collaborate with your teammates in real-time. Experience the seamless synergy of virtual workspace loaded with team chat, custom access roles, and elegant canvas controls.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <button
              onClick={handleTryNow}
              className="w-full sm:w-auto px-8 py-4 text-xs font-black rounded-xl text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 transition-all duration-300 shadow-[0_4px_25px_rgba(99,102,241,0.35)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group border-none"
            >
              Try Now Free
              <ArrowRight size={14} className="transform transition-transform group-hover:translate-x-1 duration-300" />
            </button>
            
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 text-xs font-extrabold rounded-xl text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 cursor-pointer flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="pt-24 md:pt-36">
          <div className="text-center md:text-left mb-12">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Supercharged Features
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-2 font-medium">
              Everything you need to work visually and interactively in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#121214]/65 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/20 hover:bg-[#121214]/80 transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col h-full">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 group-hover:bg-indigo-500/20">
                <Paintbrush size={18} />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2">Realtime Canvas</h3>
              <p className="text-gray-400 text-[11px] leading-relaxed font-medium flex-1">
                Synchronize your sketchpad actions instantly with ultra-low latency WebSockets. Share stroke operations, highlights, and layouts in milliseconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#121214]/65 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 hover:bg-[#121214]/80 transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col h-full">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 group-hover:bg-purple-500/20">
                <MessageSquare size={18} />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2">Built-in Session Chat</h3>
              <p className="text-gray-400 text-[11px] leading-relaxed font-medium flex-1">
                Discuss and refine visual ideas right alongside your drawing canvas using robust build-in room messaging panels.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#121214]/65 border border-white/5 rounded-2xl p-6 hover:border-pink-500/20 hover:bg-[#121214]/80 transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col h-full">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 group-hover:bg-pink-500/20">
                <Users size={18} />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2">Team Spaces</h3>
              <p className="text-gray-400 text-[11px] leading-relaxed font-medium flex-1">
                Create multiple workspace folders, invite collaborators, handle join requests, and customize drawing permissions on the fly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#121214]/65 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-[#121214]/80 transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col h-full">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 group-hover:bg-emerald-500/20">
                <Shield size={18} />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2">Secure Workspace</h3>
              <p className="text-gray-400 text-[11px] leading-relaxed font-medium flex-1">
                Protect sensitive drawing sessions with room passwords and role permissions, ensuring complete safety of your data.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-[10px] text-gray-600 relative z-10 shrink-0">
        &copy; {new Date().getFullYear()} CoCanvas. All rights reserved. Built for visually connected teams.
      </footer>

    </div>
  );
}
