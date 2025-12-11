
import React, { useState, useMemo } from 'react';
import { UserProfile, AttendanceRecord, LeaveRequest, Ticket, Document, ExpenseClaim, AttendanceType } from '../types';
import { ChevronLeftIcon, ClockIcon, ReceiptIcon, CalendarIcon, LifeBuoyIcon, FileTextIcon } from './Icons';

interface ActivityHistoryViewProps {
  user: UserProfile;
  attendanceHistory: AttendanceRecord[];
  leaves: LeaveRequest[];
  expenses: ExpenseClaim[];
  tickets: Ticket[];
  documents: Document[];
  onBack: () => void;
}

type ActivityItem = {
    id: string;
    type: 'attendance' | 'expense' | 'leave' | 'ticket' | 'document';
    timestamp: number;
    title: string;
    subtitle: string;
    details?: string;
    statusColor?: string;
    icon: any;
    colorClass: string;
};

const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({ 
    user, attendanceHistory, leaves, expenses, tickets, documents, onBack 
}) => {
    const [filterYear, setFilterYear] = useState<number | 'all'>('all');
    const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Consolidate all data
    const allActivities: ActivityItem[] = useMemo(() => {
        const myAttendance = attendanceHistory.filter(r => r.userId === user.id);
        const myExpenses = expenses.filter(e => e.userId === user.id);
        const myLeaves = leaves.filter(l => l.userId === user.id);
        const myTickets = tickets.filter(t => t.userId === user.id);
        const myDocs = documents.filter(d => d.ownerId === user.id);

        return [
            ...myAttendance.map(r => ({
                id: r.id,
                type: 'attendance' as const,
                timestamp: r.timestamp,
                title: r.type === AttendanceType.IN ? 'Clocked In' : 'Clocked Out',
                subtitle: r.location.address || 'GPS Location',
                details: r.status && r.status !== 'Regular' ? r.status : undefined,
                statusColor: r.status === 'Late' ? 'bg-orange-100 text-orange-700' : 
                             r.status === 'Half Day' ? 'bg-purple-100 text-purple-700' : 
                             r.status === 'Early Exit' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500',
                icon: ClockIcon,
                colorClass: r.type === AttendanceType.IN ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            })),
            ...myExpenses.map(e => ({
                id: e.id,
                type: 'expense' as const,
                timestamp: e.appliedOn,
                title: 'Expense Claim',
                subtitle: `₹${e.amount} - ${e.category.replace('_', ' ')}`,
                details: e.status.replace('_', ' '),
                statusColor: e.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                             e.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700',
                icon: ReceiptIcon,
                colorClass: 'bg-pink-100 text-pink-600'
            })),
            ...myLeaves.map(l => ({
                id: l.id,
                type: 'leave' as const,
                timestamp: l.appliedOn,
                title: 'Leave Request',
                subtitle: `${l.type} - ${l.reason}`,
                details: l.status,
                statusColor: l.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                             l.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700',
                icon: CalendarIcon,
                colorClass: 'bg-blue-100 text-blue-600'
            })),
            ...myTickets.map(t => ({
                id: t.id,
                type: 'ticket' as const,
                timestamp: t.date,
                title: 'Support Ticket',
                subtitle: t.subject,
                details: t.status,
                statusColor: t.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
                icon: LifeBuoyIcon,
                colorClass: 'bg-purple-100 text-purple-600'
            })),
            ...myDocs.map(d => ({
                id: d.id,
                type: 'document' as const,
                timestamp: d.date,
                title: 'Document Upload',
                subtitle: d.title,
                details: d.category,
                statusColor: 'bg-yellow-50 text-yellow-700',
                icon: FileTextIcon,
                colorClass: 'bg-yellow-100 text-yellow-600'
            }))
        ].sort((a, b) => b.timestamp - a.timestamp);
    }, [attendanceHistory, expenses, leaves, tickets, documents, user.id]);

    // Filtering
    const filteredActivities = useMemo(() => {
        return allActivities.filter(item => {
            const date = new Date(item.timestamp);
            
            // Year Filter
            if (filterYear !== 'all' && date.getFullYear() !== filterYear) return false;
            
            // Month Filter
            if (filterMonth !== 'all' && date.getMonth() !== filterMonth) return false;
            
            // Type Filter
            if (filterType !== 'all' && item.type !== filterType) return false;

            return true;
        });
    }, [allActivities, filterYear, filterMonth, filterType]);

    // Generate years for filter (from joining date or earliest activity to now)
    const availableYears = useMemo(() => {
        const startYear = user.joiningDate ? new Date(user.joiningDate).getFullYear() : new Date().getFullYear();
        const currentYear = new Date().getFullYear();
        const years: number[] = [];
        for (let y = currentYear; y >= startYear; y--) {
            years.push(y);
        }
        return years;
    }, [user.joiningDate]);

    // Grouping by Date for display
    const groupedActivities = useMemo(() => {
        const groups: { [key: string]: ActivityItem[] } = {};
        filteredActivities.forEach(item => {
            const dateKey = new Date(item.timestamp).toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(item);
        });
        return groups;
    }, [filteredActivities]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden pb-24">
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center space-x-2 shrink-0 z-10">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">Activity Log</h2>
                    <p className="text-xs text-slate-500">Timeline of all actions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                <select 
                    value={filterYear} 
                    onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                    <option value="all">All Years</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                    <option value="all">All Months</option>
                    {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                </select>

                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                    <option value="all">All Activities</option>
                    <option value="attendance">Attendance</option>
                    <option value="expense">Expenses</option>
                    <option value="leave">Leaves</option>
                    <option value="ticket">Tickets</option>
                    <option value="document">Documents</option>
                </select>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.keys(groupedActivities).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <ClockIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No activities found.</p>
                        <p className="text-xs">Try adjusting the filters.</p>
                    </div>
                ) : (
                    Object.entries(groupedActivities).map(([dateLabel, items]) => (
                        <div key={dateLabel} className="animate-fade-in">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 sticky top-0 bg-slate-50 py-1 z-0">{dateLabel}</h3>
                            <div className="space-y-3">
                                {(items as ActivityItem[]).map(item => (
                                    <div key={`${item.type}-${item.id}`} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start space-x-4">
                                        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.colorClass}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                                                <span className="text-xs font-mono font-medium text-slate-400">
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-1">{item.subtitle}</p>
                                            {item.details && (
                                                <div className="mt-2">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.statusColor}`}>
                                                        {item.details}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityHistoryView;
