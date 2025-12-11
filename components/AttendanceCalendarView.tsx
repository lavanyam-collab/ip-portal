
import React, { useState } from 'react';
import { AttendanceRecord, Holiday, LeaveRequest, UserProfile, AttendanceType } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, CheckCircleIcon, ClockIcon, MapPinIcon } from './Icons';

interface AttendanceCalendarViewProps {
  user: UserProfile;
  attendanceHistory: AttendanceRecord[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  onBack: () => void;
}

const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({ 
  user, attendanceHistory, leaves, holidays, onBack 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateDetails, setSelectedDateDetails] = useState<{
      date: Date;
      status: string;
      color: string;
      punches: AttendanceRecord[];
      leave?: LeaveRequest;
      holiday?: Holiday;
  } | null>(null);

  const today = new Date().setHours(0,0,0,0);
  const myHistory = attendanceHistory.filter(r => r.userId === user.id);

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days = [];
      
      // Pad empty days at start
      for (let i = 0; i < firstDay.getDay(); i++) {
          days.push(null);
      }
      
      for (let i = 1; i <= lastDay.getDate(); i++) {
          days.push(new Date(year, month, i));
      }
      
      return days;
  };

  const getDayStatus = (date: Date) => {
      const dateTs = date.getTime();
      const setDate = date.setHours(0,0,0,0);
      
      // 1. Holiday
      const holiday = holidays.find(h => {
          const hDate = new Date(h.date);
          return hDate.getDate() === date.getDate() && hDate.getMonth() === date.getMonth();
      });
      if (holiday) return { status: 'Holiday', color: 'bg-teal-100 text-teal-700', holiday };

      // 2. Leave
      const leave = leaves.find(l => l.userId === user.id && l.status === 'Approved' && l.startDate <= setDate && l.endDate >= setDate);
      if (leave) return { status: 'Leave', color: 'bg-blue-100 text-blue-700', leave };

      // 3. Attendance
      const punches = myHistory.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === setDate).sort((a,b) => a.timestamp - b.timestamp);
      
      if (punches.length > 0) {
          // Check for specific flags in punches
          if (punches.some(p => p.status === 'Half Day')) return { status: 'Half Day', color: 'bg-purple-100 text-purple-700', punches };
          if (punches.some(p => p.status === 'Late')) return { status: 'Late', color: 'bg-orange-100 text-orange-700', punches };
          if (punches.some(p => p.status === 'Early Exit')) return { status: 'Early Exit', color: 'bg-yellow-100 text-yellow-700', punches };
          
          return { status: 'Present', color: 'bg-green-100 text-green-700', punches };
      }

      // 4. Absent (Past dates only, exclude weekends for simplicity or assume generic mon-fri)
      // For this demo, we mark absent if it's a weekday in the past with no data
      const isPast = setDate < new Date().setHours(0,0,0,0);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (isPast && !isWeekend) {
          return { status: 'Absent', color: 'bg-red-100 text-red-700', punches: [] };
      }

      return { status: '', color: '', punches: [] };
  };

  const handleDateClick = (date: Date) => {
      const details = getDayStatus(date);
      if (details.status || date.getTime() === today) {
           setSelectedDateDetails({
               date,
               status: details.status || 'No Records',
               color: details.color,
               punches: details.punches || [],
               leave: details.leave,
               holiday: details.holiday
           });
      }
  };

  const changeMonth = (delta: number) => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + delta);
      setCurrentMonth(newDate);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in relative pb-24 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-2 shrink-0 bg-white z-10">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Attendance Calendar</h2>
        </div>

        {/* Month Nav */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-white">
            <button onClick={() => changeMonth(-1)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><ChevronLeftIcon className="w-5 h-5 text-slate-600" /></button>
            <span className="text-lg font-bold text-slate-800">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => changeMonth(1)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><ChevronRightIcon className="w-5 h-5 text-slate-600" /></button>
        </div>

        {/* Calendar Grid - SCROLLABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 min-h-0">
            <div className="grid grid-cols-7 gap-1 mb-2 sticky top-0 bg-white z-10 border-b border-slate-50">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2 pb-4">
                {getDaysInMonth(currentMonth).map((date, idx) => {
                    if (!date) return <div key={idx}></div>;
                    
                    const { status, color } = getDayStatus(date);
                    const isToday = date.setHours(0,0,0,0) === today;
                    
                    return (
                        <button 
                        key={idx} 
                        onClick={() => handleDateClick(date)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all overflow-hidden ${isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                        >
                            <span className={`text-sm font-bold z-10 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{date.getDate()}</span>
                            {status && (
                                <div className={`mt-1 px-1.5 py-0.5 rounded-full max-w-[95%] ${color}`}>
                                    <p className="text-[7px] font-bold uppercase truncate leading-none text-center">{status}</p>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 mb-8 grid grid-cols-2 gap-3 text-xs text-slate-500 pb-24">
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Present</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Late</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>Early Exit</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span>Half Day</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Absent</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Leave</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-teal-500"></div><span>Holiday</span></div>
            </div>
        </div>

        {/* Detail Popup - FIXED OVERLAY */}
        {selectedDateDetails && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="w-full bg-white rounded-t-3xl p-6 shadow-2xl max-h-[70vh] flex flex-col mb-16"> 
                    <div className="flex justify-between items-start mb-6 shrink-0">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{selectedDateDetails.date.toLocaleDateString(undefined, { weekday: 'long' })}</h3>
                            <p className="text-slate-500">{selectedDateDetails.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <button onClick={() => setSelectedDateDetails(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><XIcon className="w-6 h-6 text-slate-600" /></button>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <div className={`p-4 rounded-xl mb-6 flex items-center justify-between ${selectedDateDetails.color || 'bg-slate-100 text-slate-600'}`}>
                            <span className="font-bold text-lg">{selectedDateDetails.status}</span>
                            {selectedDateDetails.status === 'Present' && <CheckCircleIcon className="w-6 h-6" />}
                        </div>

                        {selectedDateDetails.holiday && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Occasion</h4>
                                <p className="font-medium text-slate-800">{selectedDateDetails.holiday.name}</p>
                            </div>
                        )}

                        {selectedDateDetails.leave && (
                            <div className="mb-6 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Leave Type</h4>
                                    <p className="font-medium text-slate-800">{selectedDateDetails.leave.type}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Reason</h4>
                                    <p className="font-medium text-slate-800 italic">"{selectedDateDetails.leave.reason}"</p>
                                </div>
                            </div>
                        )}

                        {selectedDateDetails.punches.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">Punch Activity</h4>
                                {selectedDateDetails.punches.map((punch, idx) => (
                                    <div key={idx} className="flex items-start space-x-3 bg-slate-50 p-3 rounded-xl">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${punch.type === AttendanceType.IN ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            <ClockIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-800 text-sm">{punch.type === AttendanceType.IN ? 'Clock In' : 'Clock Out'}</span>
                                                <span className="font-mono text-xs font-bold text-slate-600">{new Date(punch.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="flex items-center space-x-1 mt-1 text-slate-500 text-xs">
                                                <MapPinIcon className="w-3 h-3" />
                                                <span className="truncate max-w-[200px]">{punch.location.address || "GPS Location"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {selectedDateDetails.status === 'Absent' && (
                            <div className="text-center py-4 text-slate-400 text-sm">
                                No attendance records found for this date.
                            </div>
                        )}
                        
                        <div className="h-4"></div> {/* Bottom Spacer */}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AttendanceCalendarView;
