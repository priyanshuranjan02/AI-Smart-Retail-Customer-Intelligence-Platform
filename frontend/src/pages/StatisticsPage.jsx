import React, { useState, useEffect } from 'react';
import { BarChart3, Search, Download, Filter, Database, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

const StatisticsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try { setLoading(true); const data = await api.getLogs(100); setLogs(data.logs || []); }
    catch (err) { console.error('Failed to load logs:', err); }
    finally { setLoading(false); }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.prediction_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && log.prediction_type === filterType;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Prediction Type', 'Category/Outcome', 'Confidence', 'Created At'];
    const rows = filteredLogs.map((l) => [l.id, l.prediction_type, l.category, `${Math.round(l.confidence * 100)}%`, l.created_at]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_retail_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header Banner */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-emerald-900/40 via-teal-900/20 to-[var(--bg-primary)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            System Prediction Logs & Historical Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Complete audit trail of facial recognitions, product classifications, sentiment predictions, and chatbot intents.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition shrink-0"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-6 rounded-2xl glass-panel space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category or type..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <span className="text-xs text-[var(--text-secondary)] font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Predictions' },
              { id: 'face_recognition', label: 'Face Recognition' },
              { id: 'product_classification', label: 'Product CV' },
              { id: 'sentiment_analysis', label: 'Sentiment NLP' },
              { id: 'chatbot_intent', label: 'Chatbot' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  filterType === f.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:opacity-80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Prediction Model</th>
                <th className="py-3 px-4">Result / Category</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">
                    Loading prediction log database...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">
                    No prediction records match your query filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-input)]">
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">#{log.id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] font-mono text-indigo-400">
                        {log.prediction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{log.category}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-semibold">{Math.round(log.confidence * 100)}%</span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{log.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
