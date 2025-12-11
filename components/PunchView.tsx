
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, MapPinIcon, RefreshIcon, CheckCircleIcon, ClockIcon, XIcon } from './Icons';
import { AttendanceType, AttendanceRecord, AttendanceRegularization, UserProfile, Shift } from '../types';

interface PunchViewProps {
  lastPunch: AttendanceRecord | null;
  history: AttendanceRecord[];
  currentUser: UserProfile; 
  userShift?: Shift; 
  onPunch: (record: Omit<AttendanceRecord, 'userId'>) => void;
  onRegularize: (request: AttendanceRegularization) => void;
}

const PunchView: React.FC<PunchViewProps> = ({ lastPunch, history, currentUser, userShift, onPunch, onRegularize }) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'review' | 'success' | 'locked'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; shortAddress?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const watchIdRef = useRef<number | null>(null);
  const gpsTimeoutRef = useRef<number | null>(null);
  const lastGeoFetchRef = useRef<number>(0);
  
  const today = new Date().setHours(0,0,0,0);
  const todaysPunches = history.filter(h => h.timestamp >= today);
  const hasCompletedShift = todaysPunches.some(p => p.type === AttendanceType.IN) && 
                            todaysPunches.some(p => p.type === AttendanceType.OUT);

  useEffect(() => {
    if (hasCompletedShift && mode !== 'success') {
        setMode('locked');
    }
  }, [hasCompletedShift, mode]);

  const nextAction = lastPunch?.type === AttendanceType.IN ? AttendanceType.OUT : AttendanceType.IN;
  const isClockIn = nextAction === AttendanceType.IN;

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
      // Clear safety timeout as we got a signal
      if (gpsTimeoutRef.current) {
          clearTimeout(gpsTimeoutRef.current);
          gpsTimeoutRef.current = null;
      }
      setGpsLoading(false);

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // For demo purposes, we accept any location as valid. 
      // In production, you would calculate distance to OFFICE_COORDS here.
      setIsLocationValid(true); 
      setError(null);

      // IMMEDIATE UPDATE: Set coords so UI is interactive immediately. 
      setLocation(prev => {
          // Avoid jitter: if moved less than ~11 meters (0.0001 deg), don't update excessively
          if (prev && Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001) {
              return prev;
          }
          return {
              lat,
              lng,
              address: prev?.address || "Fetching address...",
              shortAddress: prev?.shortAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          };
      });

      // Reverse Geocoding (Convert Coords to Address) - ASYNC
      // Throttle: Only fetch address every 5 seconds to avoid API limits
      const now = Date.now();
      if (now - lastGeoFetchRef.current > 5000) { 
          lastGeoFetchRef.current = now;
          // Note: Using a public OSM endpoint. In production, proxy this or use a paid key.
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(res => res.json())
            .then(data => {
                if (data.display_name) {
                    const parts = data.display_name.split(', ');
                    const shortAddress = parts.slice(0, 3).join(', ');
                    setLocation({ lat, lng, address: data.display_name, shortAddress });
                } else {
                    setLocation({ lat, lng, address: `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, shortAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
                }
            })
            .catch(() => {
                // Keep coords if address fetch fails
                setLocation(prev => prev ? { ...prev, address: `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}` } : null);
            });
      }
  }, []);

  const handleGpsError = useCallback((err: GeolocationPositionError) => {
      console.warn("GPS Error:", err);
      // PERMISSION DENIED should show error immediately
      if (err.code === 1) { 
          setError("Location permission denied. Please enable it in browser settings.");
          setGpsLoading(false);
          if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
      }
      // For other errors (Timeout/Unavailable), we rely on the parallel strategy.
      // If both Fast Lock and Precise Watch fail, the safety timeout will trigger.
  }, []);

  const startGpsTracking = useCallback(() => {
      if (!navigator.geolocation) {
          setError("Geolocation is not supported by this browser.");
          return;
      }

      setGpsLoading(true);
      setError(null);

      // --- STRATEGY: PARALLEL REQUESTS ---
      
      // 1. FAST LOCK: Try to get whatever is available immediately (Cell/WiFi/Cache) to unblock UI.
      // High accuracy is OFF here for speed.
      navigator.geolocation.getCurrentPosition(
          (pos) => {
              console.log("Fast GPS Lock acquired");
              handlePositionUpdate(pos);
          }, 
          (err) => {
              console.log("Fast GPS failed, waiting for precise watch...", err.message);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
      );

      // 2. PRECISE WATCH: Start watching for better accuracy in parallel.
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      
      watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
              console.log("Precise GPS Update");
              handlePositionUpdate(pos);
          },
          handleGpsError,
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );

      // 3. SAFETY TIMEOUT
      if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
      gpsTimeoutRef.current = window.setTimeout(() => {
          // If we hit this, it means handlePositionUpdate hasn't been called yet by either method
          console.log("GPS Timeout Triggered");
          setError("GPS signal weak. Try moving outdoors or retrying.");
          setGpsLoading(false);
      }, 10000); // 10 seconds max wait

  }, [handlePositionUpdate, handleGpsError]);

  const startCamera = async () => {
    if (mode === 'locked') return;
    try {
      setError(null);
      const constraints = { video: { facingMode: 'user' }, audio: false };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setMode('camera');
      
      // Start GPS immediately when camera starts
      startGpsTracking();

    } catch (err) { console.error("Camera error:", err); setError("Camera access is required to punch."); }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
    }
    if (gpsTimeoutRef.current) {
        clearTimeout(gpsTimeoutRef.current);
        gpsTimeoutRef.current = null;
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.8));
        setMode('review');
        stopCamera();
      }
    }
  };

  const confirmPunch = () => {
    if (!location) { setError("Waiting for location signal..."); return; }
    if (!photo) { setError("Photo is missing."); return; }
    
    const newRecord = {
      id: Date.now().toString(),
      type: nextAction,
      timestamp: Date.now(),
      location: location,
      photoUrl: photo,
      remarks: remarks || undefined
    };
    onPunch(newRecord);
    setMode('success');
  };

  const reset = () => {
    stopCamera();
    setPhoto(null);
    setRemarks('');
    setMode(hasCompletedShift ? 'locked' : 'idle');
    setError(null);
    setIsLocationValid(false);
    setLocation(null);
  };

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [mode, stream]);

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  if (mode === 'locked') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-slate-50 pb-24">
            <div className="w-24 h-24 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-6"><CheckCircleIcon className="w-12 h-12" /></div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Shift Completed</h2>
            <p className="text-slate-500 text-center mb-8 max-w-xs">You have already clocked out for today.</p>
        </div>
      );
  }

  if (mode === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-white pb-24">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"><CheckCircleIcon className="w-12 h-12" /></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{!isClockIn ? 'Clocked In!' : 'Clocked Out!'}</h2>
        <p className="text-slate-500 text-center mb-2">Your attendance has been recorded.</p>
        {remarks && <p className="text-sm text-slate-400 italic mb-8">"{remarks}"</p>}
        <button onClick={reset} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium shadow-lg hover:bg-slate-800 transition-colors">Done</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden pb-24">
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 overflow-y-auto">
        <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-500 uppercase tracking-wide">{mode === 'camera' ? 'Verification' : mode === 'review' ? 'Confirm Details' : 'Current Status'}</h2>
            {mode === 'idle' && <div className={`mt-2 text-3xl font-bold ${isClockIn ? 'text-green-600' : 'text-slate-700'}`}>{isClockIn ? 'Shift Not Started' : 'Currently Working'}</div>}
            
            {mode === 'idle' && userShift && (
                <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                    <ClockIcon className="w-3 h-3" />
                    <span>{userShift.name}: {userShift.startTime} - {userShift.endTime}</span>
                </div>
            )}
        </div>

        <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center shrink-0">
            {mode === 'idle' && (
                <button onClick={startCamera} className={`w-64 h-64 rounded-full border-8 shadow-2xl flex flex-col items-center justify-center transition-transform active:scale-95 ${isClockIn ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-100 text-white shadow-blue-200' : 'bg-gradient-to-br from-red-500 to-red-600 border-red-100 text-white shadow-red-200'}`}>
                    <div className="mb-2">{isClockIn ? <CameraIcon className="w-10 h-10" /> : <CheckCircleIcon className="w-10 h-10" />}</div>
                    <span className="text-2xl font-bold tracking-tight">{isClockIn ? 'PUNCH IN' : 'PUNCH OUT'}</span>
                    <span className="text-sm opacity-80 mt-1 font-medium">Tap to verify</span>
                </button>
            )}
            {mode === 'camera' && (
                <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 relative bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                         {/* Address Pill: Shows shortened address for cleaner UI */}
                         <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 backdrop-blur-md shadow-sm max-w-full ${location ? (isLocationValid ? 'bg-green-500/80 text-white border border-green-400' : 'bg-red-500/80 text-white border border-red-400') : 'bg-yellow-500/80 text-white border border-yellow-400 animate-pulse'}`}>
                             <MapPinIcon className="w-3 h-3 shrink-0" />
                             <span className="truncate">{location ? (location.shortAddress || location.address) : (gpsLoading ? 'Locating...' : 'Waiting for GPS')}</span>
                         </div>
                    </div>
                    {/* Capture button enabled if location exists (even if invalid for demo) */}
                    <button onClick={capturePhoto} disabled={!location} className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-slate-200 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className={`w-12 h-12 rounded-full ${isLocationValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </button>
                    {/* Full Address Overlay at Bottom */}
                    {location && (
                        <div className="absolute bottom-24 left-4 right-4 bg-black/70 backdrop-blur-sm p-3 rounded-xl text-center border border-white/10">
                            <p className="text-[10px] text-white/90 font-medium leading-tight">{location.address}</p>
                        </div>
                    )}
                </div>
            )}
            {mode === 'review' && photo && (
                <div className="w-full h-full flex flex-col">
                    <div className="flex-1 rounded-3xl overflow-hidden shadow-lg border-4 border-slate-900 relative mb-4"><img src={photo} alt="Punch verification" className="w-full h-full object-cover transform -scale-x-100" /><div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-[10px] text-center leading-tight">{location?.address}</div></div>
                    <div className="space-y-3">
                         <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks (optional)..." className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none" />
                         <div className="flex space-x-3">
                             <button onClick={reset} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm flex items-center justify-center space-x-2"><RefreshIcon className="w-4 h-4" /><span>Retake</span></button>
                             <button onClick={confirmPunch} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-medium text-sm shadow-lg">Confirm {isClockIn ? 'In' : 'Out'}</button>
                         </div>
                    </div>
                </div>
            )}
        </div>

        <div className="h-12 text-center px-4 shrink-0 w-full">
             {error && <div className="text-red-500 text-sm font-medium bg-red-50 py-2 px-3 rounded-lg border border-red-100 animate-pulse flex items-center justify-between">
                 <span>{error}</span>
                 {mode === 'camera' && <button onClick={startGpsTracking} className="text-xs bg-red-200 px-2 py-1 rounded ml-2 hover:bg-red-300">Retry</button>}
             </div>}
             {!error && mode === 'idle' && (
                 <div className="flex flex-col items-center justify-center space-y-3">
                     <div className="flex items-center space-x-2 text-slate-400 text-sm"><MapPinIcon className="w-4 h-4" /><span>Precise geolocation enabled</span></div>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default PunchView;
