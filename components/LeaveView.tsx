
import React, { useState, useEffect } from 'react';
import { LeaveRequest, LeaveType, UserProfile } from '../types';
import { PlusIcon, CalendarIcon, UsersIcon, XIcon, ChevronLeftIcon } from './Icons';

interface LeaveViewProps {
  requests: LeaveRequest[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  initialTab?: 'my' | 'approvals';
  onRequestLeave: (req: LeaveRequest) => void;
  onUpdateStatus: (reqId: string, status: 'Approved' | 'Rejected') => void;
  onBack?: () => void;
}

const LeaveView: React.FC<LeaveViewProps> = ({ requests, currentUser, allUsers, initialTab = 'my', onRequestLeave, onUpdateStatus, onBack }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'approvals'>(initialTab);
  const [isApplying, setIsApplying] = useState(false);
  
  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);
  
  // Form State
  const [targetUserId, setTargetUserId] = useState<string>(currentUser.id);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<LeaveType>('CL');
  const [reason, setReason] = useState('');
  const [ccIds, setCcIds] = useState<string[]>([]);
  const [selectedCcUser, setSelectedCcUser] = useState<string>('');

  const myRequests = requests.filter(r => r.userId === currentUser.id);
  
  // STRICT FILTERING FOR APPROVALS
  const pendingApprovals = requests.filter(r => {
      if (r.status !== 'Pending') return false;
      if (r.userId === currentUser.id) return false; 
      
      const requester = allUsers.find(u => u.id === r.userId);
      if (!requester) return false;

      if (currentUser.isHR) return true; 
      if (requester.managerId === currentUser.id) return true; 
      
      return false;
  });
  
  const canApprove = currentUser.isHR || allUsers.some(u => u.managerId === currentUser.id);

  const targetUser = allUsers.find(u => u.id === targetUserId) || currentUser;
  const isTargetFemale = targetUser.gender === 'Female';
  const isFemale = currentUser.gender === 'Female';

  const manager = allUsers.find(u => u.id === targetUser.managerId);
  const hrUser = allUsers.find(u => u.isHR && u.id !== targetUser.id) || allUsers.find(u => u.isHR);

  const getLeaveQuota = (gender: 'Male' | 'Female' | 'Other', leaveType: LeaveType) => {
    if (gender === 'Female') {
        if (leaveType === 'Period') return 12;
        if (leaveType === 'CL') return 6;
        if (leaveType === 'SL') return 6;
        return 0;
    } else {
        if (leaveType === 'CL') return 12;
        if (leaveType === 'SL') return 12;
        return 0;
    }
  };

  const calculateBalances = () => {
      const used = {
          CL: myRequests.filter(r => r.type === 'CL' && r.status === 'Approved').length,
          SL: myRequests.filter(r => r.type === 'SL' && r.status === 'Approved').length,
          Period: myRequests.filter(r => r.type === 'Period' && r.status === 'Approved').length,
          PL: 0
      };

      return {
          CL: { total: getLeaveQuota(currentUser.gender, 'CL'), used: used.CL },
          SL: { total: getLeaveQuota(currentUser.gender, 'SL'), used: used.SL },
          Period: { total: getLeaveQuota(currentUser.gender, 'Period'), used: used.Period }
      };
  };

  const balances = calculateBalances();

  const getLeaveLabel = (t: LeaveType) => {
    switch (t) {
        case 'PL': return 'Privilege Leave';
        case 'CL': return 'Casual Leave';
        case 'SL': return 'Sick Leave';
        case 'Period': return 'Period Leave';
        case 'CompOff': return 'Compensatory Off';
        default: return t;
    }
  };

  const addCcUser = (userId: string) => {
      if (!userId) return;
      if (!ccIds.includes(userId) && userId !== targetUserId) {
          setCcIds(prev => [...prev, userId]);
      }
      setSelectedCcUser('');
  };

  const removeCcUser = (userId: string) => {
      setCcIds(prev => prev.filter(id => id !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAdminAssignment = currentUser.isHR && targetUserId !== currentUser.id;

    const newReq: LeaveRequest = {
        id: Date.now().toString(),
        userId: targetUserId,
        type,
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        reason,
        status: isAdminAssignment ? 'Approved' : 'Pending',
        appliedOn: Date.now(),
        ccUserIds: ccIds
    };
    onRequestLeave(newReq);
    setIsApplying(false);
    setReason('');
    setStartDate('');
    setEndDate('');
    setType('CL');
    setTargetUserId(currentUser.id); 
    setCcIds([]);
  };

  const handleCancel = () => {
    setIsApplying(false);
    setTargetUserId(currentUser.id);
    setReason('');
    setStartDate('');
    setEndDate('');
    setType('CL');
    setCcIds([]);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Approved': return 'bg-green-100 text-green-700';
          case 'Rejected': return 'bg-red-100 text-red-700';
          default: return 'bg-yellow-100 text-yellow-700';
      }
  };

  const getUserName = (userId: string) => {
      return allUsers.find(u => u.id === userId)?.name || 'Unknown User';
  };

  const availableTypes: LeaveType[] = isTargetFemale 
    ? ['CL', 'SL', 'Period', 'CompOff'] 
    : ['CL', 'SL', 'CompOff'];

  if (isApplying) {
      return (
          <div className="bg-white h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                  <h2 className="text-2xl font-bold text-slate-900">
                      {targetUserId === currentUser.id ? 'Apply Leave' : 'Assign Leave'}
                  </h2>
                  <button onClick={handleCancel} className="text-slate-400 text-sm font-medium">Cancel</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pb-20">
                  <form onSubmit={handleSubmit} className="space-y-6">
                      {/* ADMIN ASSIGNMENT SELECTION */}
                      {currentUser.isHR && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">For Employee</label>
                              <div className="relative">
                                    <select 
                                        value={targetUserId}
                                        onChange={(e) => setTargetUserId(e.target.value)}
                                        className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 appearance-none"
                                    >
                                        <option value={currentUser.id}>Myself</option>
                                        {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                                        ))}
                                    </select>
                                    <UsersIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                              </div>
                          </div>
                      )}
                      
                      {/* REQUEST ROUTING DISPLAY */}
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm space-y-2">
                          <h3 className="text-xs font-bold text-blue-800 uppercase mb-1">Request Routing</h3>
                          <div className="flex justify-between items-center">
                              <span className="text-blue-600 font-medium">Approver:</span>
                              <span className="font-bold text-slate-700">{manager ? `${manager.name}` : 'HR Department'}</span>
                          </div>
                          {hrUser && hrUser.id !== manager?.id && (
                              <div className="flex justify-between items-center pt-1 border-t border-blue-100">
                                  <span className="text-blue-600 font-medium">HR Notification:</span>
                                  <span className="font-bold text-slate-700">{hrUser.name}</span>
                              </div>
                          )}
                      </div>

                      {/* CC SECTION */}
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notify Colleagues (CC)</label>
                          <div className="relative mb-2">
                                <select 
                                    value={selectedCcUser}
                                    onChange={(e) => addCcUser(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                                >
                                    <option value="">Select colleague...</option>
                                    {allUsers.filter(u => u.id !== targetUserId && u.id !== manager?.id && u.id !== hrUser?.id).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {ccIds.map(id => {
                                  const user = allUsers.find(u => u.id === id);
                                  if (!user) return null;
                                  return (
                                      <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs font-bold">
                                          {user.name}
                                          <button onClick={() => removeCcUser(id)} className="ml-1 text-slate-400 hover:text-red-500">
                                              <XIcon className="w-3 h-3" />
                                          </button>
                                      </span>
                                  );
                              })}
                          </div>
                      </div>

                      <div className="h-px bg-slate-100 my-4"></div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Leave Type</label>
                          <div className="grid grid-cols-2 gap-3">
                              {availableTypes.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`py-3 px-2 rounded-xl border font-bold text-xs transition-all ${
                                        type === t 
                                        ? t === 'Period' ? 'bg-pink-600 text-white border-pink-600 shadow-md' : 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                        : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                                  >
                                      {getLeaveLabel(t)}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From</label>
                              <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To</label>
                              <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason</label>
                          <textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leave..." rows={3} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none resize-none" />
                      </div>

                      <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800">
                          {targetUserId !== currentUser.id ? 'Confirm Assignment' : 'Submit Request'}
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden relative">
      {/* Sticky Header */}
      <div className="p-4 bg-white border-b border-slate-100 shrink-0 z-10">
          <div className="flex items-center space-x-2 mb-4">
            {onBack && (
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            )}
            <div className="flex-1 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Leaves</h2>
                <span className="text-xs font-medium text-slate-400">{new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Manager/HR Toggle */}
          {canApprove && (
              <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                  <button onClick={() => setActiveTab('my')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>My Balances</button>
                  <button onClick={() => setActiveTab('approvals')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Approvals {pendingApprovals.length > 0 && `(${pendingApprovals.length})`}</button>
              </div>
          )}

          {activeTab === 'my' && (
             <div className={`grid gap-3 ${isFemale ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                    <span className="block text-2xl font-bold text-purple-700">{balances.CL.total - balances.CL.used}</span>
                    <span className="text-[10px] uppercase font-bold text-purple-400">Casual</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                    <span className="block text-2xl font-bold text-orange-700">{balances.SL.total - balances.SL.used}</span>
                    <span className="text-[10px] uppercase font-bold text-orange-400">Sick</span>
                </div>
                {isFemale && (
                    <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 text-center">
                        <span className="block text-2xl font-bold text-pink-600">{balances.Period.total - balances.Period.used}</span>
                        <span className="text-[10px] uppercase font-bold text-pink-400">Period</span>
                    </div>
                )}
            </div>
          )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
          {activeTab === 'my' ? (
              <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">History</h3>
                  {myRequests.slice().reverse().map(req => (
                      <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${req.type === 'Period' ? 'bg-pink-50 text-pink-500' : 'bg-slate-100 text-slate-500'}`}>
                                  <CalendarIcon className="w-5 h-5" />
                              </div>
                              <div>
                                  <div className="flex items-center space-x-2">
                                      <span className={`font-bold text-sm ${req.type === 'Period' ? 'text-pink-600' : 'text-slate-800'}`}>{getLeaveLabel(req.type)}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(req.status)}`}>{req.status}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">{new Date(req.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(req.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                              </div>
                          </div>
                      </div>
                  ))}
                  {myRequests.length === 0 && <div className="text-center py-8 text-slate-400">No requests found.</div>}
              </div>
          ) : (
              <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pending Action</h3>
                  {pendingApprovals.map(req => (
                      <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-start space-x-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><UsersIcon className="w-5 h-5" /></div>
                              <div>
                                  <div className="font-bold text-slate-800 text-sm">{getUserName(req.userId)}</div>
                                  <div className="flex items-center space-x-2 mt-0.5">
                                       <span className={`text-xs ${req.type === 'Period' ? 'text-pink-600 font-bold' : 'text-slate-500'}`}>{getLeaveLabel(req.type)}</span>
                                       <span className="text-slate-300">•</span>
                                       <span className="text-xs text-slate-500">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg italic">"{req.reason}"</p>
                              </div>
                          </div>
                          <div className="flex space-x-3 mt-2 pl-12">
                              <button onClick={() => onUpdateStatus(req.id, 'Rejected')} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">Reject</button>
                              <button onClick={() => onUpdateStatus(req.id, 'Approved')} className="flex-1 py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg">Approve</button>
                          </div>
                      </div>
                  ))}
                  {pendingApprovals.length === 0 && <div className="text-center py-8 text-slate-400">All caught up!</div>}
              </div>
          )}
      </div>

      {(activeTab === 'my' || currentUser.isHR) && !isApplying && (
        <button onClick={() => setIsApplying(true)} className="absolute bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-[60]">
            <PlusIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default LeaveView;
