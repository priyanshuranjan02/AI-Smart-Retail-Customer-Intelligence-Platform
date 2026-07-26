import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CustomerRecognition from './pages/CustomerRecognition';
import ProductClassification from './pages/ProductClassification';
import SentimentAnalysis from './pages/SentimentAnalysis';
import ChatbotPage from './pages/ChatbotPage';
import StatisticsPage from './pages/StatisticsPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);

  // Sync state to DOM root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Store Intelligence Overview',
          subtitle: 'Real-time retail traffic metrics, sentiment distributions, and category breakdowns.',
        };
      case 'face':
        return {
          title: 'Customer Facial Recognition',
          subtitle: 'Identify returning VIP loyalty customers and log in-store visits automatically.',
        };
      case 'product':
        return {
          title: 'Product Category Classifier',
          subtitle: 'MobileNetV2 Transfer Learning for Shoes, Clothes, Electronics, Groceries, Bags.',
        };
      case 'sentiment':
        return {
          title: 'Customer Review Sentiment Analysis',
          subtitle: 'TF-IDF + Logistic Regression NLP classification (Positive, Negative, Neutral).',
        };
      case 'chatbot':
        return {
          title: 'Smart Customer Support Chatbot',
          subtitle: 'Hybrid FAQ rule engine with ML Intent Classification fallback.',
        };
      case 'stats':
        return {
          title: 'System Analytics & Logs',
          subtitle: 'Complete prediction log audit trail with CSV export capabilities.',
        };
      default:
        return { title: 'Smart Retail AI Platform', subtitle: 'AI-Powered Customer Intelligence' };
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'face':
        return <CustomerRecognition />;
      case 'product':
        return <ProductClassification />;
      case 'sentiment':
        return <SentimentAnalysis />;
      case 'chatbot':
        return <ChatbotPage />;
      case 'stats':
        return <StatisticsPage />;
      default:
        return <Dashboard />;
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <main className="flex-1 overflow-y-auto pb-12">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
