import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, CheckCircle, AlertTriangle, Stethoscope } from 'lucide-react';
import axios from 'axios';

// Use plain axios (no auth interceptor) since patients may not be logged in
const publicApi = axios.create({ baseURL: '/api/v1', withCredentials: true });

const MAX_MESSAGES = 24;

const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3 flex gap-1.5 items-center shadow-md border border-slate-100">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

const IntakeFlow = () => {
  const { appointmentId } = useParams();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [complete, setComplete] = useState(false);
  const [emergency, setEmergency] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Try to get existing session from appointment
        const apptRes = await publicApi.get(`/appointments/${appointmentId}`);
        const appt = apptRes.data.data;

        // If session exists, try to resume it
        if (appt.intakeSessionId) {
          const sid = appt.intakeSessionId._id || appt.intakeSessionId;
          const sessionRes = await publicApi.get(`/intake/${sid}`);
          const session = sessionRes.data.data;

          if (session.status === 'completed') {
            setComplete(true);
            setMessages(session.messages || []);
            setInitializing(false);
            return;
          }

          if (session.messages?.length > 0) {
            setSessionId(session._id);
            setMessages(session.messages);
            setInitializing(false);
            return;
          }
        }

        // Start new session (public endpoint, no auth needed)
        const res = await publicApi.post('/intake/start', { appointmentId });
        const { sessionId: sid, message, emergencyFlag, completed } = res.data.data;

        if (completed) {
          setComplete(true);
          setInitializing(false);
          return;
        }

        setSessionId(sid);
        if (message) setMessages([{ role: 'assistant', content: message }]);
        if (emergencyFlag?.emergency) setEmergency(emergencyFlag);
      } catch (err) {
        console.error('[IntakeFlow] Init error:', err);
        console.error('[IntakeFlow] Error response:', err.response?.data);
        console.error('[IntakeFlow] Error status:', err.response?.status);
        const errorMsg = err.response?.data?.message || err.message || 'Unable to start check-in';
        setError(`${errorMsg}. Please ask the front desk for assistance.`);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [appointmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setProgress(Math.min((messages.length / MAX_MESSAGES) * 100, 95));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'patient', content: text }]);
    setLoading(true);

    try {
      const res = await publicApi.post(`/intake/${sessionId}/message`, { content: text });
      const { message, emergencyFlag, interviewComplete } = res.data.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
      if (emergencyFlag?.emergency) setEmergency(emergencyFlag);
      if (interviewComplete) {
        setComplete(true);
        setProgress(100);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Emergency overlay
  if (emergency) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center p-6 z-50">
        <div className="text-center text-white max-w-md animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <AlertTriangle size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4 leading-tight">Please inform the front desk immediately</h1>
          <p className="text-lg opacity-90 mb-3">or call emergency services</p>
          <div className="text-6xl font-bold mb-6">112</div>
          {emergency.reason && <p className="text-sm opacity-75 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">{emergency.reason}</p>}
        </div>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 border-8 border-slate-800">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-600">Preparing your check-in...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 border-8 border-slate-800">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <p className="text-sm text-red-600 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      {/* Phone-like container */}
      <div className="w-full max-w-[420px] mx-auto">
        {/* Mobile device frame simulation */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 border-8 border-slate-800 relative overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10"></div>
          
          {/* Content */}
          <div className="relative z-0 pt-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Stethoscope size={20} className="text-white" />
              </div>
              <div>
                <span className="text-base font-semibold text-slate-800">MediFlow</span>
                <p className="text-xs text-slate-500">Pre-visit check-in</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Chat area */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              {/* Messages */}
              <div className="p-4 space-y-3 h-[480px] overflow-y-auto">
                {messages.length === 0 && !loading && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-400">Starting your check-in...</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                        msg.role === 'patient'
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-md'
                          : 'bg-white text-slate-700 rounded-bl-md border border-slate-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {!complete && (
                <div className="border-t border-slate-200 p-4 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Type your response..."
                      disabled={loading}
                      className="flex-1 h-11 px-4 rounded-full border-2 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || loading}
                      className="w-11 h-11 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white flex items-center justify-center hover:shadow-lg hover:shadow-teal-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center mt-2">
                    Confidential - shared only with your doctor
                  </p>
                </div>
              )}

              {/* Completion */}
              {complete && (
                <div className="border-t border-slate-200 p-8 text-center bg-gradient-to-br from-emerald-50 to-teal-50">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20 animate-scale-in">
                    <CheckCircle size={28} className="text-emerald-600" />
                  </div>
                  <p className="text-base font-semibold text-slate-800 mb-1">Check-in Complete!</p>
                  <p className="text-xs text-slate-600">Your doctor has been briefed and is ready for your visit.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info text below phone */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Best viewed on mobile devices
        </p>
      </div>
    </div>
  );
};

export default IntakeFlow;
