import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  PackageSearch,
  MessageSquareHeart,
  BotMessageSquare,
  BarChart3,
  Sparkles,
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'face', label: 'Face Recognition', icon: UserCheck },
    { id: 'product', label: 'Product Classifier', icon: PackageSearch },
    { id: 'sentiment', label: 'Sentiment Analysis', icon: MessageSquareHeart },
    { id: 'chatbot', label: 'FAQ Chatbot', icon: BotMessageSquare },
    { id: 'stats', label: 'Analytics & Logs', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col justify-between h-screen sticky top-0 z-30 transition-colors duration-300">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-[var(--text-primary)] tracking-tight leading-none">SmartRetail</h1>
            <span className="text-xs text-indigo-400 font-medium">AI Intelligence v1.0</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 font-semibold scale-[1.02]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-500/10'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 m-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text-primary)]">FastAPI + CV + NLP</p>
        <p className="mt-1 text-[var(--text-secondary)]">Connected to local backend on port 8000.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
