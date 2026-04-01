import React from 'react'
import { User, Settings } from 'lucide-react';

const Navbar = () => {
  return (
    <div className="h-12 w-[95%] max-w-5xl m-2 text-white flex px-4 justify-between rounded-2xl border-3 border-white/20 bg-[#171717]">
        <div className="flex items-center gap-2 cursor-pointer group ">
          <div className="w-6 h-6 bg-linear-to-br from-indigo-500 to-purple-600 rounded-md rotate-3 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-white font-bold tracking-tight text-lg">
            CanvasHub
          </span>
        </div>

        <div className='flex gap-10 '>
            <div className="hidden md:flex items-center gap-10">
                {['Invite', 'Join'].map((item) => (
                    <button
                    key={item}
                    className="text-gray-400 text-sm font-medium hover:text-white transition-colors duration-200 relative group"
                    >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                    </button>
                ))}
            </div>
                
            <div className="flex items-center gap-10">
                <button className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200">
                    <User size={20} strokeWidth={1.5} />
                </button>
                <button className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200">
                    <Settings size={20} strokeWidth={1.5} />
                </button>
            </div>

        </div>
    </div>
  )
}

export default Navbar