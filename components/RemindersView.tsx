
import React, { useState } from 'react';
import { ReminderConfig } from '../types';
import { BellIcon, ChevronLeftIcon, CheckCircleIcon } from './Icons';

interface RemindersViewProps {
  config: ReminderConfig;
  onSave: (config: ReminderConfig) => void;
  onBack: () => void;
}

const RemindersView: React.FC<RemindersViewProps> = ({ config, onSave, onBack }) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [startTime, setStartTime] = useState(config.startTime);
  const [endTime, setEndTime] = useState(config.endTime);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    if (enabled && "Notification" in window) {
        Notification.requestPermission();
    }
    onSave({ enabled, startTime, endTime });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const playTestSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) { alert("Audio not supported"); return; }
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
      } catch(e) { console.error(e); alert("Could not play sound"); }
  };

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center space-x-2 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Reminders</h2>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-28">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <BellIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Punch Alerts</h3>
                        <p className="text-xs text-slate-500">Get notified to mark attendance</p>
                    </div>
                </div>
                <div 
                    onClick={() => setEnabled(!enabled)}
                    className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </div>

            {enabled && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Work Start Time</label>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-lg font-bold text-slate-800" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Work End Time</label>
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-lg font-bold text-slate-800" />
                    </div>
                    <div className="pt-2">
                        <button type="button" onClick={playTestSound} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center space-x-2">
                            <BellIcon className="w-4 h-4" />
                            <span>Test Alert Sound & Vibration</span>
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start space-x-2">
                <div className="mt-0.5 text-amber-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-amber-800 mb-1">Important</h4>
                    <p className="text-[10px] text-amber-700">Keep tab open for alerts.</p>
                </div>
            </div>
        </div>

        <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${showSuccess ? 'bg-green-600 text-white' : 'bg-slate-900 text-white active:scale-95'}`}>
            {showSuccess ? <><CheckCircleIcon className="w-5 h-5" /><span>Saved!</span></> : <span>Save Preferences</span>}
        </button>
      </div>
    </div>
  );
};

export default RemindersView;
