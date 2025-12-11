
import React, { useState } from 'react';
import { UserProfile, AttendanceRecord, LeaveRequest, PayrollRecord, Holiday, Shift, AttendanceType, Asset, Document, Ticket, ExpenseClaim } from '../types';
import { ChevronLeftIcon, RefreshIcon, DownloadIcon, XIcon, ClockIcon, PencilIcon, CheckCircleIcon, UsersIcon, FileTextIcon, ReceiptIcon, LifeBuoyIcon, MonitorIcon } from './Icons';

interface AdminConsoleViewProps {
  users: UserProfile[];
  attendanceHistory: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrollHistory: PayrollRecord[];
  holidays: Holiday[]; 
  shifts?: Shift[]; 
  assets?: Asset[]; 
  documents?: Document[];
  tickets?: Ticket[];
  expenses?: ExpenseClaim[];
  onRefresh: () => void;
  onBack: () => void;
  onUpdateHolidays: (holidays: Holiday[]) => void;
  onUpdateShifts?: (shifts: Shift[]) => void; 
  onAssignRoster?: (userIds: string[], shiftId: string, effectiveDate: string, endDate?: string) => void;
  onAdminPunch: (userId: string, timestamp: number, type: AttendanceType) => void;
}

type TabType = 'employees' | 'employee_360' | 'attendance' | 'leaves' | 'payroll' | 'holidays' | 'shifts' | 'roster' | 'manual_punch' | 'assets';

const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({ 
  users, attendanceHistory, leaves, payrollHistory, holidays = [], shifts = [], assets = [], documents = [], tickets = [], expenses = [], onRefresh, onBack, onUpdateHolidays, onUpdateShifts, onAssignRoster, onAdminPunch
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Detail Modal State
  const [detailItem, setDetailItem] = useState<{ type: string, data: any } | null>(null);

  // Employee 360 State
  const [selected360Id, setSelected360Id] = useState<string>('');

  // Holiday Form State
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Holiday Edit State
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editHolidayName, setEditHolidayName] = useState('');
  const [editHolidayDate, setEditHolidayDate] = useState('');

  // Shift Form State
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [gracePeriod, setGracePeriod] = useState('15');

  // Shift Edit State
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editShiftName, setEditShiftName] = useState('');
  const [editShiftStart, setEditShiftStart] = useState('');
  const [editShiftEnd, setEditShiftEnd] = useState('');
  const [editShiftGrace, setEditShiftGrace] = useState('');

  // Roster Bulk State
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [targetBulkShift, setTargetBulkShift] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]); 
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); 

  // Manual Punch State
  const [manualPunchUser, setManualPunchUser] = useState('');
  const [manualPunchDate, setManualPunchDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualPunchTime, setManualPunchTime] = useState('09:00');
  const [manualPunchType, setManualPunchType] = useState<AttendanceType>(AttendanceType.IN);

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
  };

  // --- HOLIDAY LOGIC ---

  const handleAddHoliday = (e: React.FormEvent) => {
      e.preventDefault();
      const newHoliday: Holiday = {
          id: Date.now().toString(),
          name: newHolidayName,
          date: new Date(newHolidayDate).getTime(),
          recurring: true
      };
      onUpdateHolidays([...holidays, newHoliday]);
      setNewHolidayName('');
      setNewHolidayDate('');
  };

  const startEditHoliday = (h: Holiday) => {
      setEditingHolidayId(h.id);
      setEditHolidayName(h.name);
      setEditHolidayDate(new Date(h.date).toISOString().split('T')[0]);
  };

  const cancelEditHoliday = () => {
      setEditingHolidayId(null);
      setEditHolidayName('');
      setEditHolidayDate('');
  };

  const saveEditHoliday = () => {
      if (!editingHolidayId) return;
      const updatedHolidays = holidays.map(h => {
          if (h.id === editingHolidayId) {
              return { ...h, name: editHolidayName, date: new Date(editHolidayDate).getTime() };
          }
          return h;
      });
      onUpdateHolidays(updatedHolidays);
      setEditingHolidayId(null);
  };

  const handleDeleteHoliday = (id: string) => {
      if (confirm('Are you sure you want to delete this holiday?')) {
          onUpdateHolidays(holidays.filter(h => h.id !== id));
      }
  };

  // --- SHIFT LOGIC ---

  const handleAddShift = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onUpdateShifts) return;
      
      const newShift: Shift = {
          id: shiftName.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4),
          name: shiftName,
          startTime: shiftStart,
          endTime: shiftEnd,
          gracePeriod: parseInt(gracePeriod) || 0,
          nightShift: false 
      };
      onUpdateShifts([...shifts, newShift]);
      setShiftName(''); setShiftStart(''); setShiftEnd('');
  };

  const startEditShift = (s: Shift) => {
      setEditingShiftId(s.id);
      setEditShiftName(s.name);
      setEditShiftStart(s.startTime);
      setEditShiftEnd(s.endTime);
      setEditShiftGrace(s.gracePeriod.toString());
  };

  const cancelEditShift = () => {
      setEditingShiftId(null);
  };

  const saveEditShift = () => {
      if (!editingShiftId || !onUpdateShifts) return;
      const updatedShifts = shifts.map(s => {
          if (s.id === editingShiftId) {
              return {
                  ...s,
                  name: editShiftName,
                  startTime: editShiftStart,
                  endTime: editShiftEnd,
                  gracePeriod: parseInt(editShiftGrace) || 0
              };
          }
          return s;
      });
      onUpdateShifts(updatedShifts);
      setEditingShiftId(null);
  };

  const handleDeleteShift = (id: string) => {
      if (!onUpdateShifts) return;
      if (confirm('Delete this shift? Users assigned to this shift ID will need reassignment.')) {
          onUpdateShifts(shifts.filter(s => s.id !== id));
      }
  };

  const toggleUserSelection = (id: string) => {
      const newSet = new Set(selectedUsers);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedUsers(newSet);
  };

  const handleBulkAssign = () => {
      if (!onAssignRoster || selectedUsers.size === 0 || !targetBulkShift) return;
      onAssignRoster(Array.from(selectedUsers), targetBulkShift, effectiveDate, endDate);
      setSelectedUsers(new Set());
      setTargetBulkShift('');
      alert(`Shift assigned to ${selectedUsers.size} employees from ${effectiveDate} to ${endDate}.`);
  };

  const handleManualPunchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualPunchUser) return;
      
      const datePart = new Date(manualPunchDate);
      const [h, m] = manualPunchTime.split(':').map(Number);
      datePart.setHours(h, m, 0, 0);
      
      onAdminPunch(manualPunchUser, datePart.getTime(), manualPunchType);
      alert("Attendance record added.");
      setManualPunchUser('');
  };

  const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
      const csvContent = [
          headers.join(','),
          ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  // --- RENDERERS ---

  const renderDetailModal = () => {
      if (!detailItem) return null;
      const { type, data } = detailItem;

      return (
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-fade-in">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-900 text-lg">{type} Details</h3>
                      <button onClick={() => setDetailItem(null)} className="p-1 hover:bg-slate-200 rounded-full"><XIcon className="w-5 h-5 text-slate-500" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <table className="w-full text-sm">
                          <tbody>
                              {Object.entries(data).map(([key, value]) => {
                                  if (typeof value === 'object' && value !== null) return null; // Skip nested objects for simple view
                                  if (key === 'id' || key === 'userId' || key === 'password') return null; // Hide internal IDs
                                  
                                  let displayValue = String(value);
                                  if (key.includes('date') || key.includes('Time') || key.includes('Applied') || key.includes('Created')) {
                                      const num = Number(value);
                                      if (!isNaN(num) && num > 1000000000000) {
                                          displayValue = new Date(num).toLocaleString();
                                      }
                                  }

                                  return (
                                      <tr key={key} className="border-b border-slate-50 last:border-0">
                                          <td className="py-3 font-bold text-slate-500 uppercase text-xs w-1/3">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                          <td className="py-3 text-slate-800 font-medium break-words">{displayValue}</td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                      {type === 'Attendance' && data.location && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Location Data</h4>
                              <p className="text-sm text-slate-800">{data.location.address || 'N/A'}</p>
                              <p className="text-xs text-slate-400 font-mono mt-1">{data.location.lat}, {data.location.lng}</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const renderEmployee360 = () => {
      // Filter out deleted users for the selector to avoid confusion, unless we want to view their history
      const activeUsers = users.filter(u => u.status !== 'Deleted');
      const user = users.find(u => u.id === selected360Id);
      const userAssets = assets.filter(a => a.assignedTo === selected360Id);
      const userLeaves = leaves.filter(l => l.userId === selected360Id);
      const userTickets = tickets.filter(t => t.userId === selected360Id);
      const userDocs = documents.filter(d => d.ownerId === selected360Id && !d.isDeleted);
      const userExpenses = expenses.filter(e => e.userId === selected360Id);

      return (
          <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Employee</label>
                  <select 
                      value={selected360Id} 
                      onChange={(e) => setSelected360Id(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  >
                      <option value="">Choose Employee...</option>
                      {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>)}
                  </select>
              </div>

              {user ? (
                  <div className="space-y-6 animate-fade-in">
                      {/* Profile Card */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-4">
                          <img src={user.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" />
                          <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
                                {user.status === 'Inactive' && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded">Inactive</span>}
                              </div>
                              <p className="text-sm text-slate-500 font-medium">{user.role} • {user.department}</p>
                              <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
                                  <span>ID: {user.employeeId}</span>
                                  <span>•</span>
                                  <span>{user.email}</span>
                                  <span>•</span>
                                  <span>{user.phone || 'No Phone'}</span>
                              </div>
                          </div>
                      </div>

                      {/* 360 Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Assets */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><MonitorIcon className="w-4 h-4 text-indigo-500" /> Assigned Assets</h4>
                              {userAssets.length === 0 ? <p className="text-xs text-slate-400">No assets assigned.</p> : (
                                  <ul className="space-y-2">
                                      {userAssets.map(a => (
                                          <li key={a.id} className="text-xs bg-slate-50 p-2 rounded flex justify-between">
                                              <span className="font-bold text-slate-700">{a.name}</span>
                                              <span className="text-slate-500 font-mono">{a.assetId}</span>
                                          </li>
                                      ))}
                                  </ul>
                              )}
                          </div>

                          {/* Leaves */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><ClockIcon className="w-4 h-4 text-orange-500" /> Recent Leaves</h4>
                              {userLeaves.length === 0 ? <p className="text-xs text-slate-400">No leave history.</p> : (
                                  <ul className="space-y-2">
                                      {userLeaves.slice(0, 3).map(l => (
                                          <li key={l.id} className="text-xs bg-slate-50 p-2 rounded flex justify-between">
                                              <span>{new Date(l.startDate).toLocaleDateString()} ({l.type})</span>
                                              <span className={`font-bold ${l.status === 'Approved' ? 'text-green-600' : 'text-orange-600'}`}>{l.status}</span>
                                          </li>
                                      ))}
                                  </ul>
                              )}
                          </div>

                          {/* Tickets */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><LifeBuoyIcon className="w-4 h-4 text-red-500" /> Support Tickets</h4>
                              {userTickets.length === 0 ? <p className="text-xs text-slate-400">No tickets raised.</p> : (
                                  <ul className="space-y-2">
                                      {userTickets.slice(0, 3).map(t => (
                                          <li key={t.id} className="text-xs bg-slate-50 p-2 rounded">
                                              <div className="flex justify-between font-bold text-slate-700"><span>{t.subject}</span><span className={t.status === 'Open' ? 'text-red-500' : 'text-green-500'}>{t.status}</span></div>
                                              <div className="text-[10px] text-slate-400 mt-1">{new Date(t.date).toLocaleDateString()} • {t.category}</div>
                                          </li>
                                      ))}
                                  </ul>
                              )}
                          </div>

                          {/* Expenses */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><ReceiptIcon className="w-4 h-4 text-pink-500" /> Recent Expenses</h4>
                              {userExpenses.length === 0 ? <p className="text-xs text-slate-400">No expense claims.</p> : (
                                  <ul className="space-y-2">
                                      {userExpenses.slice(0, 3).map(e => (
                                          <li key={e.id} className="text-xs bg-slate-50 p-2 rounded flex justify-between">
                                              <span>{e.category}</span>
                                              <span className="font-bold text-slate-700">₹{e.amount}</span>
                                          </li>
                                      ))}
                                  </ul>
                              )}
                          </div>
                          
                          {/* Documents */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-1 md:col-span-2">
                              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><FileTextIcon className="w-4 h-4 text-blue-500" /> Documents</h4>
                              {userDocs.length === 0 ? <p className="text-xs text-slate-400">No documents uploaded.</p> : (
                                  <div className="grid grid-cols-2 gap-2">
                                      {userDocs.map(d => (
                                          <div key={d.id} className="text-xs bg-slate-50 p-2 rounded flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                              <span className="truncate flex-1">{d.title}</span>
                                              <span className="text-[10px] text-slate-400 uppercase">{d.category}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="text-center py-12 text-slate-400">
                      <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Select an employee to view their 360° profile.</p>
                  </div>
              )}
          </div>
      );
  };

  const renderEmployeesTable = () => {
      // Show only active/inactive, not deleted
      const activeList = users.filter(u => u.status !== 'Deleted');
      
      const handleExport = () => {
          exportToCSV('Employees_Master', 
              ['ID', 'Name', 'Role', 'Dept', 'Email', 'Phone', 'Join Date', 'Manager', 'Status'],
              activeList.map(u => [
                  u.employeeId, u.name, u.role, u.department, u.email, u.phone || '', 
                  u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : '',
                  users.find(m => m.id === u.managerId)?.name || 'N/A',
                  u.status || 'Active'
              ])
          );
      };

      return (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <button onClick={handleExport} className="flex items-center space-x-2 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-green-700">
                      <DownloadIcon className="w-4 h-4" /> <span>Export CSV</span>
                  </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                              <th className="p-3">ID</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Role</th>
                              <th className="p-3">Status</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700">
                          {activeList.map(u => {
                              const isActive = u.status !== 'Inactive';
                              return (
                                  <tr key={u.id} onClick={() => setDetailItem({ type: 'Employee', data: u })} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${!isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                                      <td className="p-3 font-mono text-xs text-slate-500">{u.employeeId}</td>
                                      <td className="p-3 font-bold">{u.name}</td>
                                      <td className="p-3">{u.role}</td>
                                      <td className="p-3">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                              {isActive ? 'Active' : 'Inactive'}
                                          </span>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderAssetsTable = () => {
      const handleExport = () => {
          exportToCSV('Assets_Master', 
              ['Asset ID', 'Name', 'Category', 'Condition', 'Status', 'Assigned To', 'Purchase Date'],
              assets.map(a => [
                  a.assetId, a.name, a.category, a.condition, a.status,
                  a.assignedTo ? users.find(u => u.id === a.assignedTo)?.name || 'Unknown' : 'Unassigned',
                  new Date(a.purchaseDate).toLocaleDateString()
              ])
          );
      };

      return (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <button onClick={handleExport} className="flex items-center space-x-2 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-green-700">
                      <DownloadIcon className="w-4 h-4" /> <span>Export CSV</span>
                  </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                              <th className="p-3">Asset ID</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Condition</th>
                              <th className="p-3">Assigned To</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700">
                          {assets.map(a => (
                              <tr key={a.id} onClick={() => setDetailItem({ type: 'Asset', data: a })} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                                  <td className="p-3 font-mono text-xs text-slate-500">{a.assetId}</td>
                                  <td className="p-3 font-bold">{a.name}</td>
                                  <td className="p-3">{a.category}</td>
                                  <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'Available' ? 'bg-green-100 text-green-700' : a.status === 'Assigned' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                          {a.status}
                                      </span>
                                  </td>
                                  <td className="p-3">{a.condition}</td>
                                  <td className="p-3 text-xs">{a.assignedTo ? users.find(u => u.id === a.assignedTo)?.name || 'Unknown' : '-'}</td>
                              </tr>
                          ))}
                          {assets.length === 0 && (
                              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No assets recorded.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderAttendanceTable = () => {
      const sorted = [...attendanceHistory].sort((a,b) => b.timestamp - a.timestamp);
      
      const handleExport = () => {
          exportToCSV('Attendance_Logs',
              ['Date', 'Time', 'Employee', 'Type', 'Status', 'Location'],
              sorted.map(r => [
                  new Date(r.timestamp).toLocaleDateString(),
                  new Date(r.timestamp).toLocaleTimeString(),
                  users.find(u => u.id === r.userId)?.name || r.userId,
                  r.type,
                  r.status || 'Regular',
                  r.location.address || `${r.location.lat},${r.location.lng}`
              ])
          );
      };

      return (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <button onClick={handleExport} className="flex items-center space-x-2 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-green-700">
                      <DownloadIcon className="w-4 h-4" /> <span>Export CSV</span>
                  </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                              <th className="p-3">Date</th>
                              <th className="p-3">Employee</th>
                              <th className="p-3">Action</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Location</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700">
                          {sorted.slice(0, 50).map(r => (
                              <tr key={r.id} onClick={() => setDetailItem({ type: 'Attendance', data: r })} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                                  <td className="p-3 text-xs whitespace-nowrap">
                                      <div className="font-bold">{new Date(r.timestamp).toLocaleDateString()}</div>
                                      <div className="text-slate-400">{new Date(r.timestamp).toLocaleTimeString()}</div>
                                  </td>
                                  <td className="p-3 font-medium">{users.find(u => u.id === r.userId)?.name || 'Unknown'}</td>
                                  <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.type === 'CLOCK_IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {r.type.replace('_', ' ')}
                                      </span>
                                  </td>
                                  <td className="p-3">
                                      {r.status && r.status !== 'Regular' ? (
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'Half Day' ? 'bg-purple-100 text-purple-700' : r.status === 'Late' ? 'bg-orange-100 text-orange-700' : r.status === 'Early Exit' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                                      ) : <span className="text-xs text-slate-400">Regular</span>}
                                  </td>
                                  <td className="p-3 text-xs truncate max-w-[150px]">{r.location.address || 'GPS Coords'}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">Showing last 50 records</div>
              </div>
          </div>
      );
  };

  const renderLeavesTable = () => {
      const sorted = [...leaves].sort((a,b) => b.appliedOn - a.appliedOn);
      
      const handleExport = () => {
          exportToCSV('Leave_Registry',
              ['Applied On', 'Employee', 'Type', 'From', 'To', 'Reason', 'Status'],
              sorted.map(l => [
                  new Date(l.appliedOn).toLocaleDateString(),
                  users.find(u => u.id === l.userId)?.name || l.userId,
                  l.type,
                  new Date(l.startDate).toLocaleDateString(),
                  new Date(l.endDate).toLocaleDateString(),
                  l.reason,
                  l.status
              ])
          );
      };

      return (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <button onClick={handleExport} className="flex items-center space-x-2 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-green-700">
                      <DownloadIcon className="w-4 h-4" /> <span>Export CSV</span>
                  </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                              <th className="p-3">Employee</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Dates</th>
                              <th className="p-3">Status</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700">
                          {sorted.map(l => (
                              <tr key={l.id} onClick={() => setDetailItem({ type: 'Leave Request', data: l })} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                                  <td className="p-3 font-medium">{users.find(u => u.id === l.userId)?.name || 'Unknown'}</td>
                                  <td className="p-3 text-xs font-bold">{l.type}</td>
                                  <td className="p-3 text-xs">
                                      {new Date(l.startDate).toLocaleDateString()} <span className="text-slate-400">to</span> {new Date(l.endDate).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {l.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderPayrollTable = () => {
      const sorted = [...payrollHistory].sort((a,b) => b.createdDate - a.createdDate);
      
      const handleExport = () => {
          exportToCSV('Payroll_History',
              ['Month', 'Employee', 'Payable Days', 'LOP Days', 'Gross', 'Deductions', 'Net Pay', 'Status'],
              sorted.map(p => [
                  p.month,
                  users.find(u => u.id === p.employeeId)?.name || p.employeeId,
                  p.payableDays,
                  p.unpaidDays,
                  p.grossPay,
                  p.deductions,
                  p.netPay,
                  p.status
              ])
          );
      };

      return (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <button onClick={handleExport} className="flex items-center space-x-2 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-green-700">
                      <DownloadIcon className="w-4 h-4" /> <span>Export CSV</span>
                  </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                              <th className="p-3">Month</th>
                              <th className="p-3">Employee</th>
                              <th className="p-3 text-right">Net Pay</th>
                              <th className="p-3 text-center">Days (Pd/Un)</th>
                              <th className="p-3">Status</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700">
                          {sorted.map(p => (
                              <tr key={p.id} onClick={() => setDetailItem({ type: 'Payroll', data: p })} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                                  <td className="p-3 font-medium">{p.month}</td>
                                  <td className="p-3">{users.find(u => u.id === p.employeeId)?.name || 'Unknown'}</td>
                                  <td className="p-3 text-right font-mono font-bold">₹{p.netPay.toLocaleString()}</td>
                                  <td className="p-3 text-center text-xs">{p.payableDays} / <span className="text-red-500">{p.unpaidDays}</span></td>
                                  <td className="p-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">{p.status}</span>
                                  </td>
                              </tr>
                          ))}
                          {sorted.length === 0 && (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No payroll records generated yet.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderHolidaysTable = () => {
      const sortedHolidays = [...holidays].sort((a,b) => a.date - b.date);
      return (
          <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-900 mb-3">Add New Holiday</h3>
                  <form onSubmit={handleAddHoliday} className="flex gap-3">
                      <div className="flex-1">
                          <input required type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder="Holiday Name (e.g. Diwali)" className="w-full p-2 text-sm border border-blue-200 rounded-lg" />
                      </div>
                      <div className="flex-1">
                          <input required type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="w-full p-2 text-sm border border-blue-200 rounded-lg" />
                      </div>
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-blue-700">Add</button>
                  </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                              <th className="p-3">Date</th>
                              <th className="p-3">Occasion</th>
                              <th className="p-3 text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700">
                          {sortedHolidays.map(h => {
                              const isEditing = editingHolidayId === h.id;
                              return (
                                  <tr key={h.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                      <td className="p-3 font-medium text-slate-600">
                                          {isEditing ? (
                                              <input type="date" value={editHolidayDate} onChange={e => setEditHolidayDate(e.target.value)} className="p-1 border rounded text-xs w-full" />
                                          ) : (
                                              new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'})
                                          )}
                                      </td>
                                      <td className="p-3 font-bold">
                                          {isEditing ? (
                                              <input type="text" value={editHolidayName} onChange={e => setEditHolidayName(e.target.value)} className="p-1 border rounded text-xs w-full" />
                                          ) : h.name}
                                      </td>
                                      <td className="p-3 text-right">
                                          {isEditing ? (
                                              <div className="flex justify-end space-x-2">
                                                  <button onClick={saveEditHoliday} className="text-green-500 hover:bg-green-50 p-1 rounded"><CheckCircleIcon className="w-4 h-4" /></button>
                                                  <button onClick={cancelEditHoliday} className="text-slate-400 hover:bg-slate-50 p-1 rounded"><XIcon className="w-4 h-4" /></button>
                                              </div>
                                          ) : (
                                              <div className="flex justify-end space-x-2">
                                                  <button onClick={() => startEditHoliday(h)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><PencilIcon className="w-4 h-4" /></button>
                                                  <button onClick={() => handleDeleteHoliday(h.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><XIcon className="w-4 h-4" /></button>
                                              </div>
                                          )}
                                      </td>
                                  </tr>
                              );
                          })}
                          {sortedHolidays.length === 0 && (
                              <tr><td colSpan={3} className="p-8 text-center text-slate-400">No holidays added.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderShiftsTable = () => (
      <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <h3 className="text-sm font-bold text-purple-900 mb-3">Add Work Shift</h3>
              <form onSubmit={handleAddShift} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <input required value={shiftName} onChange={e => setShiftName(e.target.value)} placeholder="Shift Name" className="w-full p-2 text-sm border border-purple-200 rounded-lg col-span-2" />
                  <input required type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} className="w-full p-2 text-sm border border-purple-200 rounded-lg" />
                  <input required type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} className="w-full p-2 text-sm border border-purple-200 rounded-lg" />
                  <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">Create</button>
              </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                          <th className="p-3">Shift Name</th>
                          <th className="p-3">Timing</th>
                          <th className="p-3">Grace (Min)</th>
                          <th className="p-3 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                      {shifts.map(s => {
                          const isEditing = editingShiftId === s.id;
                          return (
                              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                  <td className="p-3 font-bold">
                                      {isEditing ? (
                                          <input type="text" value={editShiftName} onChange={e => setEditShiftName(e.target.value)} className="p-1 border rounded text-xs w-full" />
                                      ) : s.name}
                                  </td>
                                  <td className="p-3">
                                      {isEditing ? (
                                          <div className="flex items-center space-x-1">
                                              <input type="time" value={editShiftStart} onChange={e => setEditShiftStart(e.target.value)} className="p-1 border rounded text-xs" />
                                              <span>-</span>
                                              <input type="time" value={editShiftEnd} onChange={e => setEditShiftEnd(e.target.value)} className="p-1 border rounded text-xs" />
                                          </div>
                                      ) : (
                                          <div className="flex items-center space-x-2">
                                              <ClockIcon className="w-4 h-4 text-slate-400" />
                                              <span>{s.startTime} - {s.endTime}</span>
                                          </div>
                                      )}
                                  </td>
                                  <td className="p-3">
                                      {isEditing ? (
                                          <input type="number" value={editShiftGrace} onChange={e => setEditShiftGrace(e.target.value)} className="p-1 border rounded text-xs w-16" />
                                      ) : (
                                          <span>{s.gracePeriod} min</span>
                                      )}
                                  </td>
                                  <td className="p-3 text-right">
                                      {isEditing ? (
                                          <div className="flex justify-end space-x-2">
                                              <button onClick={saveEditShift} className="text-green-500 hover:bg-green-50 p-1 rounded"><CheckCircleIcon className="w-4 h-4" /></button>
                                              <button onClick={cancelEditShift} className="text-slate-400 hover:bg-slate-50 p-1 rounded"><XIcon className="w-4 h-4" /></button>
                                          </div>
                                      ) : (
                                          <div className="flex justify-end space-x-2">
                                              <button onClick={() => startEditShift(s)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><PencilIcon className="w-4 h-4" /></button>
                                              <button onClick={() => handleDeleteShift(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><XIcon className="w-4 h-4" /></button>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderRosterTable = () => (
      <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-start gap-4">
              <div className="font-bold text-sm text-slate-700 whitespace-nowrap">Schedule & Assignment</div>
              <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                  <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">From:</label>
                      <input 
                          type="date" 
                          value={effectiveDate} 
                          onChange={(e) => setEffectiveDate(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none w-full"
                      />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">To:</label>
                      <input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none w-full"
                      />
                  </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                  <select 
                      value={targetBulkShift} 
                      onChange={(e) => setTargetBulkShift(e.target.value)}
                      className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                      <option value="">Select Shift to Assign...</option>
                      {shifts.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                      ))}
                  </select>
                  <button 
                      onClick={handleBulkAssign} 
                      disabled={selectedUsers.size === 0 || !targetBulkShift}
                      className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold shadow hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto whitespace-nowrap"
                  >
                      Assign to {selectedUsers.size} Users
                  </button>
              </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                          <th className="p-3 text-center w-10">
                              <input 
                                type="checkbox" 
                                onChange={(e) => {
                                    if (e.target.checked) setSelectedUsers(new Set(users.filter(u => u.status !== 'Deleted').map(u => u.id)));
                                    else setSelectedUsers(new Set());
                                }}
                                checked={selectedUsers.size === users.filter(u => u.status !== 'Deleted').length && users.filter(u => u.status !== 'Deleted').length > 0}
                              />
                          </th>
                          <th className="p-3">Employee</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Default Shift</th>
                          <th className="p-3">Current Roster (Today)</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                      {users.filter(u => u.status !== 'Deleted').map(u => {
                          const defaultShift = shifts.find(s => s.id === u.shiftId);
                          return (
                              <tr key={u.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${selectedUsers.has(u.id) ? 'bg-blue-50' : ''}`}>
                                  <td className="p-3 text-center">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedUsers.has(u.id)} 
                                        onChange={() => toggleUserSelection(u.id)}
                                      />
                                  </td>
                                  <td className="p-3">
                                      <div className="flex items-center space-x-3">
                                          <img src={u.avatar} className="w-8 h-8 rounded-full" alt={u.name} />
                                          <div>
                                              <div className="font-bold text-slate-800">{u.name}</div>
                                              <div className="text-xs text-slate-500">{u.employeeId}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-3">
                                      <span className="text-slate-600">{u.department || 'General'}</span>
                                  </td>
                                  <td className="p-3">
                                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                          {defaultShift ? `${defaultShift.name}` : 'Not Assigned'}
                                      </span>
                                  </td>
                                  <td className="p-3">
                                      <div className="text-xs text-slate-500">
                                          (Use Date Range to update)
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderManualPunch = () => (
      <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
              <h3 className="text-sm font-bold text-orange-900 mb-3">Manual Attendance Entry</h3>
              <p className="text-xs text-orange-700 mb-4">Use this to forcefully mark attendance for an employee who missed a punch.</p>
              
              <form onSubmit={handleManualPunchSubmit} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Employee</label>
                      <select 
                        required 
                        value={manualPunchUser} 
                        onChange={(e) => setManualPunchUser(e.target.value)}
                        className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white"
                      >
                          <option value="">Choose...</option>
                          {users.filter(u => u.status !== 'Deleted').map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                          ))}
                      </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
                          <input 
                            required 
                            type="date" 
                            value={manualPunchDate} 
                            onChange={(e) => setManualPunchDate(e.target.value)} 
                            className="w-full p-2 border border-orange-200 rounded-lg text-sm"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Time</label>
                          <input 
                            required 
                            type="time" 
                            value={manualPunchTime} 
                            onChange={(e) => setManualPunchTime(e.target.value)} 
                            className="w-full p-2 border border-orange-200 rounded-lg text-sm"
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type</label>
                      <div className="flex space-x-2">
                          <button type="button" onClick={() => setManualPunchType(AttendanceType.IN)} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${manualPunchType === AttendanceType.IN ? 'bg-green-600 text-white border-green-600' : 'bg-white border-slate-200'}`}>Clock IN</button>
                          <button type="button" onClick={() => setManualPunchType(AttendanceType.OUT)} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${manualPunchType === AttendanceType.OUT ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-200'}`}>Clock OUT</button>
                      </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700">Add Record</button>
              </form>
          </div>
      </div>
  );

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden pb-24 relative">
      {/* Detail Modal */}
      {detailItem && renderDetailModal()}

      {/* Header */}
      <div className="bg-white p-4 border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-slate-900">Master Data</h2>
            </div>
            <button 
                onClick={handleRefresh} 
                className={`p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh Data from Cloud"
            >
                <RefreshIcon className="w-5 h-5" />
            </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {(['employees', 'employee_360', 'assets', 'roster', 'manual_punch', 'attendance', 'leaves', 'payroll', 'holidays', 'shifts'] as const).map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {tab === 'roster' ? 'Shift Roster' : tab.replace('_', ' ')}
                </button>
            ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'employees' && renderEmployeesTable()}
          {activeTab === 'employee_360' && renderEmployee360()}
          {activeTab === 'assets' && renderAssetsTable()}
          {activeTab === 'roster' && renderRosterTable()}
          {activeTab === 'manual_punch' && renderManualPunch()}
          {activeTab === 'attendance' && renderAttendanceTable()}
          {activeTab === 'leaves' && renderLeavesTable()}
          {activeTab === 'payroll' && renderPayrollTable()}
          {activeTab === 'holidays' && renderHolidaysTable()}
          {activeTab === 'shifts' && renderShiftsTable()}
      </div>
    </div>
  );
};

export default AdminConsoleView;
