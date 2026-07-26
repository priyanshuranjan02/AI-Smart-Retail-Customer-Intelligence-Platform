import React from 'react';
import { ShieldCheck, Sun, Moon } from 'lucide-react';

const Header = ({ title, subtitle, darkMode, setDarkMode }) => {
  return (
    <header className="h-20 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-[var(--border-color)] text-[var(--text-primary)] transition"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
        </button>

        {/* API Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          FastAPI Gateway Online
        </div>

        {/* API Key Security Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          X-API-Key Protected
        </div>
      </div>
    </header>
  );
};

export default Header;
