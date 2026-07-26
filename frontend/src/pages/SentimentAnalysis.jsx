import React, { useState, useEffect } from 'react';
import { MessageSquareHeart, Send, Smile, Frown, Meh, Sparkles, Clock } from 'lucide-react';
import { api } from '../services/api';

const SentimentAnalysis = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => { loadRecentReviews(); }, []);

  const loadRecentReviews = async () => {
    try { const data = await api.getReviews(10); setRecentReviews(data.reviews || []); }
    catch (err) { console.error('Failed to load reviews:', err); }
  };

  const samplePrompts = [
    "This retail product is amazing and top quality! 5 stars!",
    "Terrible quality, broken item arrived late and support was rude.",
    "The package arrived on time. Standard product as expected.",
  ];

  const handleAnalyze = async (textToSubmit) => {
    const text = textToSubmit || inputText;
    if (!text || !text.trim()) return;
    try {
      setLoading(true); setError(null);
      const data = await api.analyzeSentiment(text);
      setResult(data); loadRecentReviews();
    } catch (err) {
      console.error('Sentiment error:', err);
      setError(err.response?.data?.detail || 'Failed to analyze text sentiment.');
    } finally { setLoading(false); }
  };

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'Positive') {
      return (<span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5"><Smile className="w-4 h-4" /> Positive</span>);
    } else if (sentiment === 'Negative') {
      return (<span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5"><Frown className="w-4 h-4" /> Negative</span>);
    } else {
      return (<span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5"><Meh className="w-4 h-4" /> Neutral</span>);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header Banner */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-sky-900/40 via-indigo-900/20 to-[var(--bg-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <MessageSquareHeart className="w-6 h-6 text-sky-400" />
          Customer Review Sentiment Analysis (TF-IDF + Logistic Regression)
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
          Analyzes customer feedback, preprocesses text (lowercasing, stopword removal, lemmatization), and predicts Positive, Negative, or Neutral sentiment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="p-6 rounded-2xl glass-panel space-y-6">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Submit Customer Feedback</h3>

          <div className="space-y-3">
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter customer review text here..."
              className="w-full p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-sky-500 text-sm transition"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !inputText.trim()}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition"
            >
              {loading ? 'Analyzing Tokens & Model Probs...' : <><Send className="w-4 h-4" /> Analyze Sentiment</>}
            </button>
          </div>

          {/* Quick Preset Examples */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
            <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Try Preset Sample Reviews:
            </span>
            <div className="space-y-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInputText(p); handleAnalyze(p); }}
                  className="w-full text-left p-3 rounded-xl bg-[var(--bg-input)] hover:opacity-80 border border-[var(--border-color)] text-xs text-[var(--text-primary)] transition"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{error}</div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Sentiment Output</h3>

            {result ? (
              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider block">Predicted Sentiment</span>
                    <div className="mt-1.5">{getSentimentBadge(result.sentiment)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--text-secondary)] block">Confidence Score</span>
                    <span className="text-xl font-extrabold text-sky-400">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Cleaned & Lemmatized Tokens ({result.clean_tokens.length})
                  </span>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                    {result.clean_tokens.map((tok, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs">
                        {tok}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--text-secondary)] text-xs border border-dashed border-[var(--border-color)] rounded-xl">
                Enter feedback text on the left to view sentiment classification results.
              </div>
            )}
          </div>

          {/* Logged Customer Reviews List */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Recently Logged Customer Reviews</span>
              <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recentReviews.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-start justify-between gap-4 text-xs">
                  <p className="text-[var(--text-primary)] font-medium leading-relaxed">{r.text}</p>
                  <div className="shrink-0">{getSentimentBadge(r.sentiment)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;
