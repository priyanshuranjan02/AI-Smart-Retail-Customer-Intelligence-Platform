import React from 'react';

const StatCard = ({ title, value, change, icon: Icon, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/20',
    sky: 'from-sky-500/20 to-sky-600/5 text-sky-400 border-sky-500/20',
  };

  const iconBgMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    sky: 'bg-sky-500/10 text-sky-400',
  };

  return (
    <div className={`p-6 rounded-2xl glass-panel bg-gradient-to-b ${colorMap[color]} transition-all duration-300 hover:scale-[1.01]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBgMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{value}</h3>
        {change && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
