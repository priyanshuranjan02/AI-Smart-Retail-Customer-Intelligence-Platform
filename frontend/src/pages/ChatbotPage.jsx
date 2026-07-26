import React, { useState, useRef, useEffect } from 'react';
import { BotMessageSquare, Send, User, Bot, Sparkles, Tag, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! Welcome to Smart Retail Customer Support. How can I assist your shopping today?',
      intent: 'greeting',
      confidence: 1.0,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const quickQuestions = [
    "What are your store hours?",
    "What is your return policy?",
    "Where is my order tracking link?",
    "What payment methods do you accept?",
    "Are there any special discounts for returning loyalty customers?",
  ];

  const handleSendMessage = async (customText) => {
    const text = customText || inputText;
    if (!text || !text.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', text: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setLoading(true);

    try {
      const data = await api.sendChatMessage(text);
      const botMsg = { id: Date.now() + 1, sender: 'bot', text: data.bot_response, intent: data.intent, confidence: data.confidence, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMsg = { id: Date.now() + 1, sender: 'bot', text: 'Sorry, I ran into a network error while connecting to the server. Please try again.', intent: 'error', confidence: 0.0, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages((prev) => [...prev, errorMsg]);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-[var(--bg-primary)] shrink-0">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BotMessageSquare className="w-6 h-6 text-indigo-400" />
          Smart Retail Hybrid FAQ Chatbot (Rule Engine + ML Intent Classifier)
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Answers FAQs regarding store hours, returns, refunds, order tracking, shipping, payment, and loyalty rewards.
        </p>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2.5 rounded-full shrink-0 ${m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'}`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-xl space-y-1.5 ${m.sender === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                      : 'bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>

                <div className={`flex items-center gap-2 text-[10px] text-[var(--text-secondary)] ${m.sender === 'user' ? 'justify-end' : ''}`}>
                  <span>{m.time}</span>
                  {m.intent && m.sender === 'bot' && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      Intent: {m.intent} ({Math.round(m.confidence * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-indigo-400 font-medium p-3 rounded-xl bg-[var(--bg-input)] w-max">
              <Sparkles className="w-4 h-4 animate-spin" /> Chatbot is matching intent patterns...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="py-3 border-t border-[var(--border-color)] flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> FAQ Prompts:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 rounded-full bg-[var(--bg-input)] hover:opacity-80 border border-[var(--border-color)] text-xs text-[var(--text-primary)] whitespace-nowrap transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="mt-3 flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question (e.g. 'What is your return policy?')..."
            className="flex-1 p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-indigo-500 text-sm transition"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;
