import React from "react";
import { Home } from "lucide-react";

export default function HomeButton() {
  const handleClick = () => {
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleClick}
      className="group relative p-2 bg-purple-500 rounded-xl backdrop-blur-sm shadow-lg transition-all duration-300 ease-out hover:bg-purple-400 hover:scale-105 hover:shadow-xl active:scale-95 active:bg-purple-600/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-transparent"
      aria-label="Go to Home"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-purple-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse" />

      <Home className="w-6 h-6 text-white transition-all duration-300 ease-out group-hover:text-white/90 group-hover:drop-shadow-sm group-active:scale-90" />

      <div className="absolute inset-0 rounded-xl bg-purple-400/20 scale-0 group-active:scale-100 group-active:opacity-30 transition-all duration-200 ease-out opacity-0" />
    </button>
  );
}
