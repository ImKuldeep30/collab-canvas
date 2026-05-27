import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Paintbrush, MessageSquare, Users, Shield, ArrowRight, Zap, 
  Clock, Activity, Layout, ChevronDown, HelpCircle, FileText, CheckCircle, Lock, MousePointer
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const handleTryNow = () => {
    navigate('/login');
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Paintbrush size={20} />,
      title: "Realtime Collaborative Canvas",
      description: "Synchronize your Excalidraw whiteboard instantly with ultra-low latency. Share shapes, pen drawings, image uploads, and cursor indicators in real-time.",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      icon: <Activity size={20} />,
      title: "Realtime Pointer Tracking",
      description: "See exactly where your team members are pointing and drawing with fluid cursor tracks, custom pointer tags, and live presence badges.",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      icon: <Clock size={20} />,
      title: "Timed Session Management",
      description: "Establish 30-minute or 1-hour session time limits. A real-time countdown badge tracks duration for all users, automatically re-syncing and saving work.",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
    },
    {
      icon: <MessageSquare size={20} />,
      title: "Integrated Group Chat",
      description: "Brainstorm and chat directly alongside your whiteboard. Use the persistent sidebar chat to collaborate, toggle chat permissions, and view message histories.",
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
    },
    {
      icon: <Users size={20} />,
      title: "Team Workspaces",
      description: "Organize collaborators into separate Teams. Invite teammates, manage join requests, assign drawing privileges, and track ongoing whiteboard projects.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      icon: <Shield size={20} />,
      title: "Secure Custom Roles",
      description: "Protect sensitive blueprints by enforcing optional session passwords, monitoring visitor requests, and dynamically switching drawing rights.",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    }
  ];

  const faqs = [
    {
      q: "How does the Real-time whiteboard synchronization work?",
      a: "CoCanvas uses highly optimized WebSocket channels. Every stroke, shape, and image file is transmitted in micro-seconds, ensuring all participants share a perfectly synchronized workspace without lag."
    },
    {
      q: "How do session expiration timers function?",
      a: "When creating a local or team drawing room, admins choose a 30-minute or 1-hour time limit. The server counts down in real-time, synchronizing the timer to all users. Upon expiration, the drawing is saved and the canvas resets cleanly."
    },
    {
      q: "Can I manage who has permission to draw?",
      a: "Absolutely. Team owners can view active participants in the sidebar panel and toggle drawing permission on/off dynamically for any user. Admins can also kick users or delegate roles."
    },
    {
      q: "What is the difference between Local and Team sessions?",
      a: "Local sessions are ephemeral and lightweight for quick mockups. Team sessions are authenticated, meaning database logs sync your team lists, chat history, and drawings persistently in the database."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white relative flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* Background Decorative Blur Blobs wrapped in overflow-hidden container to prevent extra bottom scroll height */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[130px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-pink-500/10 rounded-full blur-[130px]"></div>
        <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] bg-purple-500/5 rounded-full blur-[130px]"></div>
      </div>

      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between relative z-10 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
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
          <span className="text-white font-extrabold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-indigo-200">
            CoCanvas
          </span>
        </div>
        
        <button
          onClick={handleTryNow}
          className="px-5 py-2 text-xs font-extrabold rounded-xl text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_2px_10px_rgba(99,102,241,0.1)]"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10 py-12 md:py-24 space-y-32">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest animate-pulse">
              <Zap size={10} className="fill-indigo-400" />
              Collaborative Whiteboarding Redefined
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Realtime Collaborative <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
                Whiteboard Workspace
              </span>
            </h1>
            
            <p className="text-gray-400 text-sm md:text-base font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Draw, conceptualize, and structure visual plans in real-time. Boost your team's synergy with integrated Excalidraw whiteboards, instant group chat, customizable roles, and automated session timers.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={handleTryNow}
                className="w-full sm:w-auto px-8 py-4 text-xs font-black rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-[0_4px_25px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group border-none"
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

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <span className="block text-2xl font-black text-white">0ms</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sync Latency</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block text-2xl font-black text-indigo-400">100%</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Free & Open</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block text-2xl font-black text-purple-400">Secure</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Encrypted Sockets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Simulated Workspace Card */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            
            {/* Glassmorphic Interactive Dashboard Preview */}
            <div className="w-full max-w-sm bg-[#121214]/65 border border-white/10 rounded-2xl p-5 shadow-[0_25px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                </div>
                {/* Simulated Timer badge */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md font-mono text-[9px] font-black animate-pulse">
                  <span className="relative flex h-1 w-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-rose-500"></span>
                  </span>
                  <span>29:45 LEFT</span>
                </div>
              </div>

              {/* Whiteboard Mock */}
              <div className="bg-black/40 border border-white/5 rounded-xl h-44 flex items-center justify-center relative overflow-hidden shadow-inner">
                {/* Grid dots background pattern */}
                <div className="absolute inset-0 opacity-15" style={{
                  backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
                  backgroundSize: "16px 16px"
                }}></div>

                {/* Floating vectors */}
                <div className="absolute w-24 h-16 border border-indigo-500/30 rounded bg-indigo-500/5 flex items-center justify-center text-[10px] font-bold text-indigo-400 shadow-md">
                  Whiteboard
                </div>
                <div className="absolute top-8 right-12 w-8 h-8 rounded-full border border-purple-500/30 bg-purple-500/5 flex items-center justify-center text-purple-400 text-xs font-bold shadow-md">
                  Core
                </div>

                {/* Live cursors mock */}
                <div className="absolute bottom-10 left-16 flex items-center gap-1.5 bg-indigo-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg animate-bounce">
                  <span>✏️ Verified User</span>
                </div>
              </div>

              {/* Chat Panel mock */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <MessageSquare size={10} /> Active Team Chat
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start gap-2 shadow-inner">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[8px] font-extrabold shrink-0 mt-0.5">
                    VU
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-gray-300">Verified User</span>
                    <p className="text-[10px] text-gray-400 leading-normal">Looks complete! Let's start sketching the blueprint flow.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Pointer Spotlight Section */}
        <section className="relative overflow-hidden border border-purple-500/20 bg-purple-500/5 rounded-3xl p-8 md:p-12 shadow-[0_15px_30px_rgba(139,92,246,0.05)] hover:border-purple-500/30 transition-all duration-500">
          <div className="absolute top-[-20%] right-[-10%] w-[35vw] h-[35vw] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest animate-pulse">
                <Activity size={10} className="text-purple-400" />
                Live Synchronization
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                Frictionless Multi-User <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                  Realtime Pointer Tracking
                </span>
              </h2>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-xl font-medium">
                Keep the entire team visually aligned with pixel-perfect cursor tracks, customized pointer tags, and real-time color presence. Coordinate designs instantly, reference specific coordinates on the canvas, and monitor ongoing whiteboard edits with zero delay.
              </p>
              
              <ul className="space-y-3 pt-2 text-xs font-semibold text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-purple-400 shrink-0" />
                  Ultra-low latency pointer syncing utilizing secure WebSockets.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-purple-400 shrink-0" />
                  Distinct color tags and visual names for each active collaborator.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-purple-400 shrink-0" />
                  Zero cursor jumps - smooth frame interpolation for natural tracking.
                </li>
              </ul>
            </div>

            {/* Pointer Mock Card */}
            <div className="lg:col-span-5 w-full flex items-center justify-center">
              <div className="bg-[#121214]/85 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative w-full h-48 overflow-hidden flex items-center justify-center">
                {/* Visual cursor track lines */}
                <div className="absolute top-10 left-10 w-24 h-24 border border-dashed border-indigo-500/20 rounded-full animate-ping pointer-events-none"></div>
                
                {/* Pointer 1 */}
                <div className="absolute top-12 left-16 flex flex-col gap-1 items-start transition-all hover:scale-105">
                  <div className="flex items-center gap-1 bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">
                    <MousePointer size={8} className="fill-white" />
                    <span>Sarah (Product)</span>
                  </div>
                </div>

                {/* Pointer 2 */}
                <div className="absolute bottom-16 right-20 flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-1 bg-pink-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                    <MousePointer size={8} className="fill-white" />
                    <span>John (Dev)</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mt-20">
                  Multi-User Cursor Tracks Active
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Features Grid */}
        <section id="features" className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-white">
              Supercharged Canvas Suite
            </h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed">
              Every detail engineered to empower visual brainstorming, session persistence, and frictionless security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="bg-[#121214]/65 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/20 hover:bg-[#121214]/80 transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col h-full hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)] cursor-pointer hover:scale-[1.02]"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 border ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-extrabold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-[11px] leading-relaxed font-medium flex-1">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive FAQ / How It Works Section */}
        <section className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed">
              Clear questions and detailed explanations on how to maximize your whiteboard collaborative workflow.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-[#121214]/50 border border-white/5 rounded-2xl p-4 md:p-5 transition-all duration-300 cursor-pointer"
                onClick={() => toggleFaq(index)}
              >
                <div className="flex items-center justify-between text-xs md:text-sm font-extrabold text-white select-none">
                  <span className="flex items-center gap-2">
                    <HelpCircle size={14} className="text-indigo-400" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-500 transform transition-transform duration-300 ${activeFaq === index ? 'rotate-180 text-white' : ''}`} 
                  />
                </div>
                
                {activeFaq === index && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-[11px] md:text-xs text-gray-400 leading-relaxed font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Closing Call To Action (CTA) */}
        <section className="text-center py-12 md:py-20 relative overflow-hidden bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-3xl hover:border-indigo-500/30 transition-colors duration-500">
          <div className="absolute inset-0 bg-[#0a0a0c]/40 backdrop-blur-3xl -z-10"></div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Ready to Accelerate Brainstorming?
          </h2>
          <p className="text-gray-400 text-xs md:text-sm max-w-xl mx-auto mb-8 font-medium leading-relaxed">
            Create an account in seconds or launch a lightweight, ephemeral local whiteboard to collaborate instantly with visitor credentials.
          </p>
          <button
            onClick={handleTryNow}
            className="px-8 py-4 text-xs font-black rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-[0_4px_25px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center gap-2 border-none mx-auto"
          >
            Get Started Now
            <ArrowRight size={14} />
          </button>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-[10px] text-gray-600 relative z-10 shrink-0">
        &copy; {new Date().getFullYear()} CoCanvas. All rights reserved. Designed for modern visual connections.
      </footer>

    </div>
  );
}
