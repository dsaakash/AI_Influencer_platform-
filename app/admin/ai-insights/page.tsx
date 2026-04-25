'use client';

import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, ShieldAlert, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAIInsightsPage() {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [selectedInf, setSelectedInf] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [fraud, setFraud] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [loadingFraud, setLoadingFraud] = useState(false);
  const [predictDays, setPredictDays] = useState(7);

  useEffect(() => {
    fetch('/api/influencers').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setInfluencers(arr);
      if (arr[0]) setSelectedInf(arr[0].id);
    });
  }, []);

  const generateInsights = async () => {
    if (!selectedInf) return;
    setLoadingInsights(true);
    setInsights(null);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ influencerId: selectedInf }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInsights({ error: data.error || 'Failed to generate insights' });
      } else {
        setInsights(data);
      }
    } catch (err) {
      setInsights({ error: 'Network error. Please check your connection.' });
    } finally {
      setLoadingInsights(false);
    }
  };

  const generatePrediction = async () => {
    setLoadingPredict(true);
    setPrediction(null);
    try {
      const res = await fetch('/api/ai/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: predictDays }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPrediction({ error: data.error || 'Failed to generate prediction' });
      } else {
        setPrediction(data);
      }
    } catch (err) {
      setPrediction({ error: 'Network error.' });
    } finally {
      setLoadingPredict(false);
    }
  };

  const runFraudDetection = async () => {
    setLoadingFraud(true);
    setFraud(null);
    try {
      const res = await fetch('/api/ai/fraud', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setFraud({ error: data.error || 'Fraud scan failed' });
      } else {
        setFraud(data);
      }
    } catch (err) {
      setFraud({ error: 'Network error.' });
    } finally {
      setLoadingFraud(false);
    }
  };

  const insightTypeColors: Record<string, string> = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  const fraudStatusColors: Record<string, string> = {
    clean: 'badge-confirmed',
    suspicious: 'badge-pending',
    flagged: 'badge-rejected',
  };

  const trendColors: Record<string, string> = {
    growing: 'text-emerald-400',
    stable: 'text-indigo-400',
    declining: 'text-rose-400',
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" /> AI Insights
          <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Powered by Gemini</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm">AI-driven analysis, predictions, and fraud detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature A: Performance Insights */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Performance Insights</h3>
              <p className="text-xs text-slate-500">AI analysis for any influencer</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <select className="w-full px-3 py-2.5 rounded-lg text-sm" value={selectedInf} onChange={e => setSelectedInf(e.target.value)}>
              {influencers.map(inf => <option key={inf.id} value={inf.id}>{inf.user?.name}</option>)}
            </select>
          </div>
          <button id="generate-insights-btn" onClick={generateInsights} disabled={loadingInsights || !selectedInf} className="btn-primary w-full justify-center">
            {loadingInsights ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Generate Insights</>}
          </button>

          {insights && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {insights.error ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <p className="font-semibold mb-1">⚠️ Error</p>
                  <p>{insights.error}</p>
                  {insights.error.includes('Too Many Requests') && (
                    <p className="mt-2 opacity-70 italic text-[10px]">Gemini Free Tier quota reached. Please wait 30-60 seconds and try again.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-300 leading-relaxed">{insights.summary}</p>
                  </div>
                  {insights.insights?.map((ins: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border text-xs ${insightTypeColors[ins.type] || insightTypeColors.neutral}`}>
                      <p className="font-semibold mb-1">{ins.title}</p>
                      <p className="opacity-80">{ins.detail}</p>
                    </div>
                  ))}
                  {insights.recommendation && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                      <p className="font-semibold mb-1">💡 Recommendation</p>
                      <p>{insights.recommendation}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Feature B: Sales Prediction */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Sales Prediction</h3>
              <p className="text-xs text-slate-500">Forecast future revenue</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <select className="w-full px-3 py-2.5 rounded-lg text-sm" value={predictDays} onChange={e => setPredictDays(Number(e.target.value))}>
              <option value={7}>Next 7 days</option>
              <option value={30}>Next 30 days</option>
            </select>
          </div>
          <button id="predict-sales-btn" onClick={generatePrediction} disabled={loadingPredict} className="btn-primary w-full justify-center" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
            {loadingPredict ? <><Loader2 className="w-4 h-4 animate-spin" />Predicting...</> : <><TrendingUp className="w-4 h-4" />Predict Revenue</>}
          </button>

          {prediction && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {prediction.error ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <p className="font-semibold mb-1">⚠️ Error</p>
                  <p>{prediction.error}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Predicted Total</span>
                      <span className={`text-xs font-bold ${trendColors[prediction.trend] || 'text-white'}`}>
                        {prediction.trend?.toUpperCase()} {prediction.trendPercent > 0 ? `+${prediction.trendPercent}%` : `${prediction.trendPercent}%`}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatCurrency(prediction.totalPredicted || 0)}</p>
                    <p className="text-xs text-slate-400 mt-1">{prediction.summary}</p>
                  </div>
                  {prediction.predictions && (
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={prediction.predictions}>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false}
                          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => formatCurrency(v)}
                          contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 11 }} />
                        <Line type="monotone" dataKey="predictedAmount" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Feature C: Fraud Detection */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Fraud Detection</h3>
              <p className="text-xs text-slate-500">Detect fake clicks & anomalies</p>
            </div>
          </div>
          <button id="run-fraud-detection-btn" onClick={runFraudDetection} disabled={loadingFraud} className="btn-primary w-full justify-center" style={{ background: 'linear-gradient(135deg, #e11d48, #ea580c)' }}>
            {loadingFraud ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</> : <><ShieldAlert className="w-4 h-4" />Run Fraud Scan</>}
          </button>

          {fraud && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {fraud.error ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <p className="font-semibold mb-1">⚠️ Error</p>
                  <p>{fraud.error}</p>
                </div>
              ) : (
                <>
                  {fraud.summary && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">{fraud.summary}</div>
                  )}
                  {fraud.results?.map((r: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{r.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${fraudStatusColors[r.status] || ''}`}>{r.status}</span>
                          <span className={`text-xs font-bold ${r.riskScore > 60 ? 'text-rose-400' : r.riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {r.riskScore}/100
                          </span>
                        </div>
                      </div>
                      {r.flags?.length > 0 && (
                        <ul className="text-xs text-slate-400 mt-1 space-y-0.5">
                          {r.flags.map((f: string, j: number) => <li key={j}>• {f}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
