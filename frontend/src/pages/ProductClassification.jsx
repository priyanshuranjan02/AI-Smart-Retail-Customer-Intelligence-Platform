import React, { useState } from 'react';
import { PackageSearch, Upload, Layers, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const ProductClassification = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const processClassification = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.classifyProduct(selectedFile);
      setResult(data);
    } catch (err) {
      console.error('Product classification error:', err);
      setError(err.response?.data?.detail || 'Failed to classify product image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header Banner */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-purple-900/40 via-indigo-900/20 to-[var(--bg-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <PackageSearch className="w-6 h-6 text-purple-400" />
          MobileNetV2 Product Classification & Feature Extraction
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
          Classifies retail product images into 5 core categories: Shoes, Clothes, Electronics, Groceries, Bags with OpenCV preprocessing inspection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Upload & Action */}
        <div className="p-6 rounded-2xl glass-panel space-y-6">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Upload Product Image</h3>

          <label className="border-2 border-dashed border-[var(--border-color)] hover:border-purple-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-[var(--bg-input)]/30 hover:bg-[var(--bg-input)]/60">
            <Upload className="w-10 h-10 text-purple-400 mb-3" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Click or drag product image here</span>
            <span className="text-xs text-[var(--text-secondary)] mt-1">Supports Shoes, Clothes, Electronics, Groceries, Bags</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          {previewUrl && (
            <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-4">
              <span className="text-xs font-semibold text-[var(--text-secondary)] block">Selected Product Preview:</span>
              <img src={previewUrl} alt="Product Preview" className="w-full h-64 object-contain rounded-lg bg-[var(--bg-input)] p-2 border border-[var(--border-color)]" />
              <button
                onClick={processClassification}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Classifying Category...</>
                ) : (
                  <><PackageSearch className="w-4 h-4" /> Classify Product Category</>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Prediction Results & OpenCV Preprocessing Stats */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Prediction Results</h3>

            {result ? (
              <div className="space-y-6">
                {/* Predicted Category Card */}
                <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Top Predicted Category</span>
                    <h4 className="text-2xl font-black text-[var(--text-primary)] mt-1">{result.category}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--text-secondary)] block">Confidence Score</span>
                    <span className="text-xl font-extrabold text-emerald-400">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>

                {/* Probability Distribution Meters */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Category Probabilities</h4>
                  {Object.entries(result.all_probabilities || {}).map(([cat, prob]) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={cat === result.category ? 'text-purple-400 font-bold' : 'text-[var(--text-secondary)]'}>{cat}</span>
                        <span className="text-[var(--text-primary)]">{Math.round(prob * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            cat === result.category ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-slate-400/30'
                          }`}
                          style={{ width: `${Math.max(5, prob * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* OpenCV Preprocessing Meta */}
                {result.preprocessing && (
                  <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                    <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" /> OpenCV Preprocessing Metadata
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                        <span className="text-[var(--text-secondary)] block">Original Dimension</span>
                        <span className="text-[var(--text-primary)] font-mono">{result.preprocessing.original_size.join(' x ')} px</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                        <span className="text-[var(--text-secondary)] block">Resized Target</span>
                        <span className="text-[var(--text-primary)] font-mono">{result.preprocessing.resized_size.join(' x ')} px</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                        <span className="text-[var(--text-secondary)] block">Gaussian Blur Filter</span>
                        <span className="text-emerald-400 font-semibold">Applied (5x5 Kernel)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                        <span className="text-[var(--text-secondary)] block">Canny Edge Pixels</span>
                        <span className="text-indigo-400 font-semibold">{result.preprocessing.edge_pixels} px</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--text-secondary)] text-xs border border-dashed border-[var(--border-color)] rounded-xl">
                Upload a product image to test category classification.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductClassification;
