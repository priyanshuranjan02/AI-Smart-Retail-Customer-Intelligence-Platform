import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Users, UserCheck, UserX, Smile, Frown, Meh } from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Could not connect to FastAPI server. Please verify backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Loading Smart Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <h3 className="font-bold text-lg">Connection Error</h3>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Detect current theme for chart text colors
  const isLight = document.documentElement.classList.contains('light');
  const chartTextColor = isLight ? '#475569' : '#94a3b8';
  const chartGridColor = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)';

  // Chart 1: Daily Visit Line Chart
  const lineChartData = {
    labels: stats.daily_visits.map((d) => d.date),
    datasets: [
      {
        label: 'Total Visits',
        data: stats.daily_visits.map((d) => d.visits),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Returning Customers',
        data: stats.daily_visits.map((d) => d.returning),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart 2: Sentiment Pie / Doughnut Chart
  const doughnutChartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          stats.sentiment_distribution.positive,
          stats.sentiment_distribution.neutral,
          stats.sentiment_distribution.negative,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f43f5e'],
        borderWidth: 0,
      },
    ],
  };

  // Chart 3: Top Product Categories Bar Chart
  const barChartData = {
    labels: Object.keys(stats.top_product_categories),
    datasets: [
      {
        label: 'Classified Items',
        data: Object.values(stats.top_product_categories),
        backgroundColor: ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: chartTextColor, font: { family: 'sans-serif', size: 12 } },
      },
    },
    scales: {
      x: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } },
      y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } },
    },
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Store Visits"
          value={stats.total_visits}
          change="+18.4% this month"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Returning Customers"
          value={stats.returning_customers}
          change={`${Math.round((stats.returning_customers / (stats.total_visits || 1)) * 100)}% loyalty rate`}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Unknown Visitors"
          value={stats.unknown_customers}
          change="Logged automatically"
          icon={UserX}
          color="amber"
        />
        <StatCard
          title="Positive Customer Reviews"
          value={stats.positive_reviews}
          change={`${stats.negative_reviews} Negative logged`}
          icon={Smile}
          color="sky"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Visits Line Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Daily Customer Traffic Trend</h3>
          <div className="h-72">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Sentiment Distribution Doughnut */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Sentiment Distribution</h3>
          <div className="h-60 relative flex items-center justify-center">
            <Doughnut
              data={doughnutChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: chartTextColor } } },
              }}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-around text-center text-xs">
            <div>
              <span className="text-emerald-400 font-bold block text-base">{stats.positive_reviews}</span>
              <span className="text-[var(--text-secondary)]">Positive</span>
            </div>
            <div>
              <span className="text-blue-400 font-bold block text-base">{stats.neutral_reviews}</span>
              <span className="text-[var(--text-secondary)]">Neutral</span>
            </div>
            <div>
              <span className="text-rose-400 font-bold block text-base">{stats.negative_reviews}</span>
              <span className="text-[var(--text-secondary)]">Negative</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Product Category Classification Chart */}
      <div className="p-6 rounded-2xl glass-panel">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Product Category Distribution (CV Model)</h3>
        <div className="h-64">
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
