
import React from 'react';
import { UserProfile } from '../types';
import { FolderIcon, LifeBuoyIcon, UserIcon, LogOutIcon, CurrencyIcon, ChartBarIcon, UsersIcon, DatabaseIcon, ReceiptIcon, CalendarIcon, MonitorIcon, TrashIcon } from './Icons';

interface AppsViewProps {
  user: UserProfile;
  onNavigate: (view: 'documents' | 'helpdesk' | 'profile' | 'payroll' | 'hrms' | 'manager_team' | 'admin_console' | 'expenses' | 'attendance_calendar' | 'assets' | 'leaves' | 'recycle_bin') => void;
  onLogout: () => void;
}

const AppsView: React.FC<AppsViewProps> = ({ user, onNavigate, onLogout }) => {
  const isManager = ['VP', 'D1', 'M1', 'M2'].includes(user.level) || user.role.includes('Manager') || user.role.includes('Director') || user.role.includes('VP');

  const apps = [
    { id: 'attendance_calendar', label: 'Attendance', icon: CalendarIcon, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'leaves', label: 'Leaves', icon: CalendarIcon, color: 'bg-blue-50 text-blue-600' },
    { id: 'assets', label: 'Assets', icon: MonitorIcon, color: 'bg-teal-50 text-teal-600' },
    { id: 'documents', label: 'Documents', icon: FolderIcon, color: 'bg-orange-50 text-orange-600' },
    { id: 'payroll', label: 'Payroll', icon: CurrencyIcon, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'expenses', label: 'Expenses', icon: ReceiptIcon, color: 'bg-pink-50 text-pink-600' },
    { id: 'helpdesk', label: 'Helpdesk', icon: LifeBuoyIcon, color: 'bg-green-50 text-green-600' },
    { id: 'profile', label: 'My Profile', icon: UserIcon, color: 'bg-blue-50 text-blue-600' },
  ];

  // Common button classes for perfect uniformity
  // Removed explicit height (h-28) to avoid conflict with aspect-square on varying screen widths
  const buttonBaseClass = "p-2 rounded-2xl shadow-sm border flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-all active:scale-95 aspect-square group w-full";
  const iconContainerClass = "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm";
  const labelClass = "font-bold text-[11px] text-center leading-tight w-full truncate px-1";

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden pb-24">
      {/* Fixed Header */}
      <div className="px-6 pt-6 pb-4 shrink-0 bg-slate-50 z-10">
        <h2 className="text-xl font-bold text-slate-900">Apps & Services</h2>
        <p className="text-xs text-slate-500">Access your tools</p>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Admin Exclusive Apps */}
            {user.isHR && (
                <>
                    <button 
                        onClick={() => onNavigate('hrms')}
                        className={`${buttonBaseClass} bg-slate-900 border-slate-800 relative overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
                        <div className={`${iconContainerClass} bg-white/10 text-white border border-white/10 relative z-10 backdrop-blur-sm`}>
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <span className={`${labelClass} text-white relative z-10`}>HRMS</span>
                    </button>

                    <button 
                        onClick={() => onNavigate('admin_console')}
                        className={`${buttonBaseClass} bg-white border-purple-100`}
                    >
                        <div className={`${iconContainerClass} bg-purple-50 text-purple-600`}>
                            <DatabaseIcon className="w-6 h-6" />
                        </div>
                        <span className={`${labelClass} text-slate-800`}>Master Data</span>
                    </button>

                    <button 
                        onClick={() => onNavigate('recycle_bin')}
                        className={`${buttonBaseClass} bg-white border-red-100`}
                    >
                        <div className={`${iconContainerClass} bg-red-50 text-red-600`}>
                            <TrashIcon className="w-6 h-6" />
                        </div>
                        <span className={`${labelClass} text-slate-800`}>Recycle Bin</span>
                    </button>
                </>
            )}

            {/* Manager Exclusive App */}
            {isManager && (
                <button 
                    onClick={() => onNavigate('manager_team')}
                    className={`${buttonBaseClass} bg-white border-blue-100`}
                >
                    <div className={`${iconContainerClass} bg-blue-50 text-blue-600`}>
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <span className={`${labelClass} text-slate-800`}>My Team</span>
                </button>
            )}

            {/* Standard Apps */}
            {apps.map((app) => (
            <button 
                key={app.id}
                onClick={() => onNavigate(app.id as any)}
                className={`${buttonBaseClass} bg-white border-slate-200`}
            >
                <div className={`${iconContainerClass} ${app.color}`}>
                    <app.icon className="w-6 h-6" />
                </div>
                <span className={`${labelClass} text-slate-800`}>{app.label}</span>
            </button>
            ))}
        </div>
        
        <div className="mt-auto space-y-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <h3 className="font-bold text-indigo-900 text-xs uppercase tracking-wide">Company Announcement</h3>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                    Don't forget to complete your quarterly goals by Friday. Reach out to your manager for assistance.
                </p>
            </div>

            <button 
                onClick={onLogout}
                className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center space-x-3 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-[0.98]"
            >
                <LogOutIcon className="w-5 h-5" />
                <span className="font-bold text-sm">Sign Out</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AppsView;
