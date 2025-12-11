
import React, { useEffect, useState } from 'react';
import { UserProfile, AttendanceRecord, AttendanceType, LeaveRequest, Holiday, ExpenseClaim, Ticket, Document, EmployeeUpdate, AttendanceRegularization, AppNotification } from '../types';
import { generateDailyInsight } from '../services/geminiService';
import { UsersIcon, FolderIcon, CheckCircleIcon, LifeBuoyIcon, ClockIcon, CalendarIcon, ReceiptIcon, FileTextIcon, ChevronRightIcon, XIcon, BellIcon, InteriorPlusLogo, MapPinIcon } from './Icons';

interface DashboardProps {
  user: UserProfile;
  allUsers: UserProfile[]; 
  leaves: LeaveRequest[]; 
  attendanceHistory: AttendanceRecord[];
  expenses: ExpenseClaim[];
  tickets: Ticket[];
  documents: Document[];
  regularizations: AttendanceRegularization[];
  updates?: EmployeeUpdate[];
  holidays?: Holiday[]; 
  notifications?: AppNotification[];
  onNavigateToPunch: () => void;
  onNavigateToDirectory: () => void;
  onNavigateToDocuments: () => void;
  onNavigateToLeaves: () => void;
  onNavigateToAttendance: () => void;
  onNavigateToActivityHistory: () => void;
  onNavigateToCompanyBuzz: () => void;
  onNavigateToHelpdesk: () => void;
  onNavigateToApprovals: (category: 'leaves' | 'expenses' | 'attendance') => void;
  onNavigateToNotifications: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, allUsers, leaves, attendanceHistory, expenses, tickets, documents, regularizations, updates = [], holidays = [], notifications = [],
  onNavigateToPunch, onNavigateToDirectory, onNavigateToDocuments, onNavigateToLeaves, onNavigateToAttendance, onNavigateToActivityHistory, onNavigateToCompanyBuzz, onNavigateToHelpdesk, onNavigateToApprovals, onNavigateToNotifications
}) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState<boolean>(true);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  
  // Dynamic Time State for Greeting
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date().setHours(0,0,0,0);
  
  const myHistory = attendanceHistory.filter(r => r.userId === user.id);
  const lastRecord = myHistory.length > 0 ? myHistory[myHistory.length - 1] : null;
  const isWorking = lastRecord?.type === AttendanceType.IN;
  const directReports = allUsers.filter(u => u.managerId === user.id);
  const isManager = directReports.length > 0;

  const pendingLeaveRequests = leaves.filter(l => l.status === 'Pending' && (user.isHR || directReports.some(report => report.id === l.userId))).length;
  const pendingExpenses = expenses.filter(e => {
      if (user.isHR && e.status === 'Pending_HR') return true;
      if (isManager && e.status === 'Pending_Manager' && directReports.some(r => r.id === e.userId)) return true;
      return false;
  }).length;
  const pendingRegularizations = regularizations.filter(r => r.status === 'Pending' && (user.isHR || directReports.some(u => u.id === r.userId))).length;
  const totalPendingActions = pendingLeaveRequests + pendingExpenses + pendingRegularizations;

  const upcomingHoliday = holidays.filter(h => h.date >= today).sort((a,b) => a.date - b.date)[0];
  const latestUpdate = updates.length > 0 ? updates[0] : null;
  
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Update clock every minute
  useEffect(() => {
      const timer = setInterval(() => setCurrentDate(new Date()), 60000);
      return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
      const hour = currentDate.getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isWorking && lastRecord) {
        interval = setInterval(() => {
            const now = Date.now();
            const diff = now - lastRecord.timestamp;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
    } else { setElapsedTime("00:00:00"); }
    return () => clearInterval(interval);
  }, [isWorking, lastRecord]);

  const calculateHoursToday = () => {
    let milliseconds = 0; let lastInTime = 0;
    const todaysRecords = myHistory.filter(r => r.timestamp >= today).sort((a, b) => a.timestamp - b.timestamp);
    todaysRecords.forEach(record => {
      if (record.type === AttendanceType.IN) lastInTime = record.timestamp;
      else if (record.type === AttendanceType.OUT && lastInTime !== 0) { milliseconds += (record.timestamp - lastInTime); lastInTime = 0; }
    });
    if (lastInTime !== 0) milliseconds += (Date.now() - lastInTime);
    return milliseconds / (1000 * 60 * 60);
  };

  const hoursToday = calculateHoursToday();

  useEffect(() => {
    const fetchInsight = async () => {
      setLoadingInsight(true);
      const text = await generateDailyInsight(user.name.split(' ')[0], lastRecord, hoursToday);
      setInsight(text);
      setLoadingInsight(false);
    };
    fetchInsight();
  }, [user.name, myHistory.length]);

  type ActivityItem = { id: string; type: 'attendance' | 'expense' | 'leave' | 'ticket' | 'document'; timestamp: number; title: string; subtitle: string; statusBadge?: string; statusColor?: string; icon: any; colorClass: string; };

  const activities: ActivityItem[] = [
      ...myHistory.map(r => ({ id: r.id, type: 'attendance' as const, timestamp: r.timestamp, title: r.type === AttendanceType.IN ? 'Clocked In' : 'Clocked Out', subtitle: r.location.address || 'Location Recorded', statusBadge: r.status && r.status !== 'Regular' ? r.status : undefined, statusColor: r.status === 'Late' ? 'bg-orange-100 text-orange-700' : r.status === 'Half Day' ? 'bg-purple-100 text-purple-700' : r.status === 'Early Exit' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600', icon: ClockIcon, colorClass: r.type === AttendanceType.IN ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600' })),
      ...expenses.filter(e => e.userId === user.id).map(e => ({ id: e.id, type: 'expense' as const, timestamp: e.appliedOn, title: 'Expense Claim', subtitle: `₹${e.amount} - ${e.category}`, statusBadge: e.status.replace('_', ' '), statusColor: e.status === 'Approved' ? 'bg-green-100 text-green-700' : e.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700', icon: ReceiptIcon, colorClass: 'bg-pink-100 text-pink-600' })),
      ...leaves.filter(l => l.userId === user.id).map(l => ({ id: l.id, type: 'leave' as const, timestamp: l.appliedOn, title: 'Leave Request', subtitle: `${l.type} - ${l.status}`, icon: CalendarIcon, colorClass: 'bg-blue-100 text-blue-600' })),
      ...tickets.filter(t => t.userId === user.id).map(t => ({ id: t.id, type: 'ticket' as const, timestamp: t.date, title: 'Support Ticket', subtitle: `${t.category} - ${t.status}`, icon: LifeBuoyIcon, colorClass: 'bg-purple-100 text-purple-600' })),
      ...documents.filter(d => d.ownerId === user.id).map(d => ({ id: d.id, type: 'document' as const, timestamp: d.date, title: 'Document Upload', subtitle: d.title, icon: FileTextIcon, colorClass: 'bg-yellow-100 text-yellow-600' }))
  ].sort((a,b) => b.timestamp - a.timestamp).slice(0, 8);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 relative pb-28 no-scrollbar">
      <div className="p-4 space-y-6">
        {showHolidayModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Holiday Calendar</h3>
                        <button onClick={() => setShowHolidayModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><XIcon className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <div className="overflow-y-auto p-4 space-y-3 flex-1">
                        {holidays.length === 0 ? <p className="text-center text-slate-400 text-sm">No holidays listed.</p> : 
                            holidays.sort((a,b) => a.date - b.date).map(h => {
                                const isPast = h.date < today;
                                return (
                                    <div key={h.id} className={`flex items-center justify-between p-3 rounded-xl border ${isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-purple-100 shadow-sm'}`}>
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs flex-col leading-none ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-purple-100 text-purple-700'}`}>
                                                <span>{new Date(h.date).getDate()}</span>
                                                <span className="text-[8px] uppercase">{new Date(h.date).toLocaleDateString(undefined, {month:'short'})}</span>
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-bold ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>{h.name}</h4>
                                                <p className="text-[10px] text-slate-400">{new Date(h.date).toLocaleDateString(undefined, {weekday:'long'})}</p>
                                            </div>
                                        </div>
                                        {!isPast && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Upcoming</span>}
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center pt-2">
            <div>
                <div className="mb-2">
                    <InteriorPlusLogo className="h-8 w-auto" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-slate-900">{getGreeting()}, {user.name.split(' ')[0]}</h1>
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 mt-1">
                        <MapPinIcon className="w-3 h-3 text-slate-400" />
                        <span>{user.location}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-bold font-mono">{currentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <button onClick={onNavigateToNotifications} className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all">
                    <BellIcon className="w-5 h-5 text-slate-600" />
                    {unreadNotifications > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>}
                </button>
                <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
            </div>
        </div>

        {(isManager || user.isHR) && totalPendingActions > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-orange-100 relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span><span>Action Required</span></h3>
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">{totalPendingActions} Pending</span>
                    </div>
                    <div className="space-y-2">
                        {pendingLeaveRequests > 0 && (<div onClick={() => onNavigateToApprovals('leaves')} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"><div className="flex items-center space-x-2"><div className="p-1.5 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-100"><CalendarIcon className="w-3 h-3" /></div><span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">Leave Requests</span></div><div className="flex items-center space-x-1"><span className="text-xs font-bold text-slate-800">{pendingLeaveRequests}</span><ChevronRightIcon className="w-3 h-3 text-slate-300" /></div></div>)}
                        {pendingExpenses > 0 && (<div onClick={() => onNavigateToApprovals('expenses')} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"><div className="flex items-center space-x-2"><div className="p-1.5 bg-pink-50 text-pink-600 rounded-md group-hover:bg-pink-100"><ReceiptIcon className="w-3 h-3" /></div><span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">Expense Claims</span></div><div className="flex items-center space-x-1"><span className="text-xs font-bold text-slate-800">{pendingExpenses}</span><ChevronRightIcon className="w-3 h-3 text-slate-300" /></div></div>)}
                        {pendingRegularizations > 0 && (<div onClick={() => onNavigateToApprovals('attendance')} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"><div className="flex items-center space-x-2"><div className="p-1.5 bg-purple-50 text-purple-600 rounded-md group-hover:bg-purple-100"><ClockIcon className="w-3 h-3" /></div><span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">Regularizations</span></div><div className="flex items-center space-x-1"><span className="text-xs font-bold text-slate-800">{pendingRegularizations}</span><ChevronRightIcon className="w-3 h-3 text-slate-300" /></div></div>)}
                    </div>
                </div>
            </div>
        )}

        {isManager && totalPendingActions === 0 && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-800 text-sm">My Team</h3></div>
                <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
                    {directReports.map(report => {
                        const lastPunch = attendanceHistory.filter(r => r.userId === report.id).sort((a,b) => b.timestamp - a.timestamp)[0];
                        const isReportWorking = lastPunch && lastPunch.type === AttendanceType.IN && lastPunch.timestamp > today;
                        const isOnLeave = leaves.some(l => l.userId === report.id && l.status === 'Approved' && l.startDate <= Date.now() && l.endDate >= Date.now());
                        return (
                            <div key={report.id} className="flex flex-col items-center space-y-1 min-w-[64px]">
                                <div className="relative"><img src={report.avatar} className="w-12 h-12 rounded-full border border-slate-100 object-cover" /><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnLeave ? 'bg-orange-400' : isReportWorking ? 'bg-green-500' : 'bg-slate-300'}`}></div></div>
                                <span className="text-[10px] text-slate-600 font-medium truncate w-16 text-center">{report.name.split(' ')[0]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {user.isHR && (
            <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                <div className="flex justify-between items-center mb-5 relative z-10"><div><h3 className="font-bold text-lg text-white">Admin Console</h3><p className="text-xs text-slate-400">Workforce Management</p></div><div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center space-x-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div><span className="text-[10px] font-bold tracking-wide">HR ACCESS</span></div></div>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <button onClick={onNavigateToDirectory} className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl flex items-center space-x-3 transition-all"><div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center"><UsersIcon className="w-4 h-4" /></div><div className="text-left"><span className="block text-xs font-bold text-white">Staff</span></div></button>
                    <button onClick={onNavigateToDocuments} className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl flex items-center space-x-3 transition-all"><div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center"><FolderIcon className="w-4 h-4" /></div><div className="text-left"><span className="block text-xs font-bold text-white">Uploads</span></div></button>
                    <button onClick={onNavigateToLeaves} className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl flex items-center space-x-3 transition-all"><div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center"><CheckCircleIcon className="w-4 h-4" /></div><div className="text-left"><span className="block text-xs font-bold text-white">Approvals</span></div></button>
                    <button onClick={onNavigateToHelpdesk} className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl flex items-center space-x-3 transition-all"><div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center"><LifeBuoyIcon className="w-4 h-4" /></div><div className="text-left"><span className="block text-xs font-bold text-white">Support</span></div></button>
                </div>
            </div>
        )}

        {latestUpdate && (
            <div className="space-y-2">
                <div className="flex justify-between items-center px-1"><h3 className="font-bold text-slate-800">Company Buzz</h3><button onClick={onNavigateToCompanyBuzz} className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button></div>
                <div onClick={onNavigateToCompanyBuzz} className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group h-48">
                    {latestUpdate.attachmentUrl && latestUpdate.attachmentType === 'image' ? (
                        <div className="absolute inset-0"><img src={latestUpdate.attachmentUrl} alt="Buzz" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90"></div></div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-700"><div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div></div>
                    )}
                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                        <div className="flex items-center space-x-2 mb-2"><span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">Company Buzz</span><span className="text-[10px] text-white/70 font-medium">{new Date(latestUpdate.timestamp).toLocaleDateString()}</span></div>
                        <div className="flex items-start space-x-3"><img src={latestUpdate.avatar} alt="Author" className="w-8 h-8 rounded-full border border-white/30" /><div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-2 leading-relaxed"><span className="font-bold opacity-100 mr-1">{latestUpdate.author}:</span><span className="opacity-90">"{latestUpdate.content}"</span></p></div></div>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${isWorking ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}><ClockIcon className="w-4 h-4" /></div><div><span className={`block text-2xl font-bold font-mono ${isWorking ? 'text-green-600' : 'text-slate-400'}`}>{isWorking ? elapsedTime : "OFF"}</span><span className="text-xs text-slate-500 font-medium">{isWorking ? 'Session Time' : 'Not Clocked In'}</span></div></div>
            <div onClick={onNavigateToPunch} className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between h-32 cursor-pointer active:scale-95 transition-transform"><div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div><div><span className="block text-lg font-bold text-blue-900">{lastRecord?.type === AttendanceType.IN ? 'Clock Out' : 'Clock In'}</span><span className="text-xs text-blue-600 font-medium">Tap to update</span></div></div>
        </div>

        {upcomingHoliday && (
            <div onClick={() => setShowHolidayModal(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                <div className="relative z-10"><p className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-1">Upcoming Holiday</p><h3 className="font-bold text-lg">{upcomingHoliday.name}</h3><p className="text-xs text-purple-100">{new Date(upcomingHoliday.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p></div>
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm relative z-10"><CalendarIcon className="w-6 h-6 text-white" /></div>
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800">Recent Activity</h3><button onClick={onNavigateToActivityHistory} className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700"><span>View All</span><ChevronRightIcon className="w-3 h-3" /></button></div>
            <div className="divide-y divide-slate-50">
                {activities.length === 0 ? (<div className="p-8 text-center text-slate-400 text-sm">No recent activity. Start your day!</div>) : (
                    activities.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="p-4 flex items-start space-x-4">
                            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.colorClass}`}><item.icon className="w-4 h-4" /></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start"><p className="text-sm font-bold text-slate-800">{item.title}</p><span className="text-xs font-semibold text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                <div className="flex justify-between items-center mt-1"><div className="flex items-center space-x-2"><p className="text-xs text-slate-500 truncate max-w-[150px]">{item.subtitle}</p>{item.statusBadge && (<span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase ${item.statusColor}`}>{item.statusBadge}</span>)}</div><span className="text-xs font-medium text-slate-300">{new Date(item.timestamp).toLocaleDateString()}</span></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
