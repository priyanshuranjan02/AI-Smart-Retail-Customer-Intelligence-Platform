import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, UserCheck, UserX, Clock, ShieldCheck, RefreshCw, UserPlus } from 'lucide-react';
import { api } from '../services/api';

const CustomerRecognition = () => {
  const [activeMode, setActiveMode] = useState('recognize');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [regCode, setRegCode] = useState('');
  const [regName, setRegName] = useState('');
  const [regFile, setRegFile] = useState(null);
  const [regPreviewUrl, setRegPreviewUrl] = useState(null);
  const [regSuccess, setRegSuccess] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);

  useEffect(() => { loadRecentVisits(); }, []);

  const loadRecentVisits = async () => {
    try { const data = await api.getVisits(10); setRecentVisits(data.visits || []); }
    catch (err) { console.error('Failed to load visits:', err); }
  };

  const handleFileChange = (e, isReg = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isReg) { setRegFile(file); setRegPreviewUrl(URL.createObjectURL(file)); setRegSuccess(null); setError(null); }
      else { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setResult(null); setError(null); }
    }
  };

  const startWebcam = async () => {
    try { setWebcamActive(true); const stream = await navigator.mediaDevices.getUserMedia({ video: true }); if (videoRef.current) { videoRef.current.srcObject = stream; } }
    catch (err) { console.error('Webcam permission error:', err); setError('Could not access webcam. Please check browser permissions.'); setWebcamActive(false); }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) { const stream = videoRef.current.srcObject; stream.getTracks().forEach((track) => track.stop()); videoRef.current.srcObject = null; }
    setWebcamActive(false);
  };

  const captureWebcamSnapshot = (isReg = false) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current; const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
          if (isReg) { setRegFile(file); setRegPreviewUrl(URL.createObjectURL(blob)); }
          else { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(blob)); }
          stopWebcam();
        }
      }, 'image/jpeg');
    }
  };

  const processRecognition = async () => {
    if (!selectedFile) return;
    try { setLoading(true); setError(null); const data = await api.recognizeFace(selectedFile); setResult(data); loadRecentVisits(); }
    catch (err) { console.error('Recognition error:', err); setError(err.response?.data?.detail || 'Failed to process face recognition.'); }
    finally { setLoading(false); }
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!regCode || !regName || !regFile) { setError('Please fill in all fields and provide a face photo.'); return; }
    try { setLoading(true); setError(null); setRegSuccess(null); const data = await api.registerCustomer(regCode, regName, regFile); setRegSuccess(`Successfully registered customer: ${data.name} (${data.customer_code})!`); setRegCode(''); setRegName(''); setRegFile(null); setRegPreviewUrl(null); }
    catch (err) { console.error('Registration error:', err); setError(err.response?.data?.detail || 'Failed to register new customer.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header banner */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-[var(--bg-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-indigo-400" />
          Facial Recognition & Customer Loyalty Logging
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
          Instantly recognizes registered returning VIP customers using facial encodings and logs visit timestamps into SQLite DB.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Mode Tabs & Forms */}
        <div className="p-6 rounded-2xl glass-panel space-y-6 flex flex-col">
          {/* Mode Tabs */}
          <div className="flex bg-[var(--bg-input)] p-1.5 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => { setActiveMode('recognize'); setError(null); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                activeMode === 'recognize' ? 'bg-indigo-600 text-white shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Identify Customer
            </button>
            <button
              onClick={() => { setActiveMode('register'); setError(null); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                activeMode === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Register New VIP
            </button>
          </div>

          {activeMode === 'recognize' ? (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Input Source</h3>

              {webcamActive ? (
                <div className="relative rounded-xl overflow-hidden bg-[var(--bg-input)] border border-indigo-500/50">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button onClick={() => captureWebcamSnapshot(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Capture Snapshot
                    </button>
                    <button onClick={stopWebcam} className="px-4 py-2 bg-[var(--bg-input)] hover:opacity-80 text-[var(--text-secondary)] font-semibold text-xs rounded-xl border border-[var(--border-color)]">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-[var(--border-color)] hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-[var(--bg-input)]/30 hover:bg-[var(--bg-input)]/60">
                    <Upload className="w-10 h-10 text-indigo-400 mb-3" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Click to upload customer photo</span>
                    <span className="text-xs text-[var(--text-secondary)] mt-1">Supports JPG, PNG, WEBP</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, false)} className="hidden" />
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="h-px bg-[var(--border-color)] flex-1"></div>
                    <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Or</span>
                    <div className="h-px bg-[var(--border-color)] flex-1"></div>
                  </div>

                  <button onClick={startWebcam} className="w-full py-3 px-4 rounded-xl bg-[var(--bg-input)] hover:opacity-80 border border-[var(--border-color)] text-[var(--text-secondary)] font-medium text-sm flex items-center justify-center gap-2 transition">
                    <Camera className="w-4 h-4 text-indigo-400" /> Start Live Webcam
                  </button>
                </div>
              )}

              {previewUrl && (
                <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-4">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] block">Preview Image:</span>
                  <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-lg border border-[var(--border-color)]" />
                  <button onClick={processRecognition} disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition">
                    {loading ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Processing Face Encodings...</>) : (<><UserCheck className="w-4 h-4" /> Run Face Recognition Pipeline</>)}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegisterCustomer} className="space-y-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Register Loyalty Customer</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Unique Customer Code</label>
                  <input type="text" value={regCode} onChange={(e) => setRegCode(e.target.value)} placeholder="e.g. CUST-1004" required className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 text-xs transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Customer Full Name</label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="e.g. John Doe" required className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 text-xs transition" />
                </div>
              </div>

              {webcamActive ? (
                <div className="relative rounded-xl overflow-hidden bg-[var(--bg-input)] border border-indigo-500/50">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button type="button" onClick={() => captureWebcamSnapshot(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Capture Snapshot
                    </button>
                    <button type="button" onClick={stopWebcam} className="px-4 py-2 bg-[var(--bg-input)] hover:opacity-80 text-[var(--text-secondary)] font-semibold text-xs rounded-xl border border-[var(--border-color)]">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-[var(--border-color)] hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-[var(--bg-input)]/30 hover:bg-[var(--bg-input)]/60">
                    <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Upload portrait photo of customer</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, true)} className="hidden" />
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="h-px bg-[var(--border-color)] flex-1"></div>
                    <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Or</span>
                    <div className="h-px bg-[var(--border-color)] flex-1"></div>
                  </div>

                  <button type="button" onClick={startWebcam} className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-input)] hover:opacity-80 border border-[var(--border-color)] text-[var(--text-secondary)] font-medium text-xs flex items-center justify-center gap-2 transition">
                    <Camera className="w-4 h-4 text-indigo-400" /> Use Webcam for Snapshot
                  </button>
                </div>
              )}

              {regPreviewUrl && (
                <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-3">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] block">Registered Face Preview:</span>
                  <img src={regPreviewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-[var(--border-color)]" />
                </div>
              )}

              <button type="submit" disabled={loading || !regCode || !regName || !regFile} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register loyalty Profile'}
              </button>
            </form>
          )}

          {regSuccess && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">{regSuccess}</div>)}
          {error && (<div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{error}</div>)}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Recognition Result</h3>
            {result ? (
              <div className="space-y-4">
                <div className={`p-5 rounded-xl border flex items-center gap-4 ${result.known ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                  <div className={`p-3 rounded-full ${result.known ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                    {result.known ? <UserCheck className="w-8 h-8 text-emerald-400" /> : <UserX className="w-8 h-8 text-amber-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[var(--text-primary)]">{result.customer_name}</h4>
                    <p className="text-xs mt-0.5">
                      ID: <span className="font-mono font-semibold">{result.customer_id}</span> • Status:{' '}
                      <span className="font-semibold">{result.known ? 'Registered Returning VIP' : 'New Visitor'}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)] block">Match Confidence</span>
                    <span className="text-base font-bold text-indigo-400">{Math.round(result.confidence * 100)}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)] block">Face Detected</span>
                    <span className="text-base font-bold text-emerald-400">{result.face_detected ? 'Yes (Haar / HOG)' : 'No'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--text-secondary)] text-xs border border-dashed border-[var(--border-color)] rounded-xl">
                Upload or capture an image to execute face recognition.
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl glass-panel">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center justify-between">
              <span>Recent In-Store Visit Logs</span>
              <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Customer ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Visit Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                  {recentVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-[var(--bg-input)]">
                      <td className="py-2.5 px-3 font-mono text-indigo-400">{v.customer_code}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${v.status === 'Known' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{Math.round(v.confidence * 100)}%</td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{v.visit_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRecognition;
