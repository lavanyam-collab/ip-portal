
import React, { useState, useEffect } from 'react';
import { UserProfile, AttendanceRecord, LeaveRequest, AttendanceType, AttendanceRegularization, Shift, RosterAssignment } from '../types';
import { ChevronLeftIcon, UsersIcon, CheckCircleIcon, ClockIcon, CalendarIcon, XIcon } from './Icons';
import { getShiftForDate } from '../services/storage';

interface ManagerTeamViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  attendanceHistory: AttendanceRecord[];
  leaves: LeaveRequest[];
  regularizations: AttendanceRegularization[];
  shifts: Shift[];
  rosterAssignments: RosterAssignment[];
  initialTab?: 'roster' | 'approvals';
  onBack: () => void;
  onNavigateToLeaves: () => void;
  onRegularizationAction: (reqId: string, action: 'Approved' | 'Rejected') => void;
}

const ManagerTeamView: React.FC<ManagerTeamViewProps> = ({ 
  currentUser, allUsers, attendanceHistory, leaves, regularizations, shifts, rosterAssignments, initialTab = 'roster', onBack, onNavigateToLeaves, onRegularizationAction
}) => {
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'leave'>('all');
  const [activeTab, setActiveTab] = useState<'roster' | 'approvals'>(initialTab);

  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);

  // Filter Direct Reports
  const myTeam = allUsers.filter(u => u.managerId === currentUser.id);
  const today = new Date().setHours(0,0,0,0);

  // Stats Logic
  const pendingLeaves = leaves.filter(l => l.status === 'Pending' && myTeam.some(m => m.id === l.userId)).length;
  
  // Pending Regularizations
  const pendingRegularizations = regularizations.filter(r => 
      r.status === 'Pending' && (myTeam.some(m => m.id === r.userId) || currentUser.isHR)
  );

  const teamStatus = myTeam.map(member => {
      // Get Today's Punches
      const todaysPunches = attendanceHistory
        .filter(r => r.userId === member.id && new Date(r.timestamp).setHours(0,0,0,0) === today)
        .sort((a,b) => a.timestamp - b.timestamp);

      const punchIn = todaysPunches.find(p => p.type === AttendanceType.IN);
      const punchOut = todaysPunches.find(p => p.type === AttendanceType.OUT);
      
      const isPresent = !!punchIn;
      const isOnLeave = leaves.some(l => l.userId === member.id && l.status === 'Approved' && l.startDate <= Date.now() && l.endDate >= Date.now());
      const totalPunches = attendanceHistory.filter(r => r.userId === member.id && r.type === AttendanceType.IN).length;
      const performanceScore = Math.min(100, 85 + (totalPunches % 15));

      // STRICT STATUS CALCULATION
      let displayStatus = 'Absent';
      let statusColor = 'text-slate-300';
      let bgStatus = 'bg-slate-100';

      if (isOnLeave) {
          displayStatus = 'On Leave';
          statusColor = 'text-orange-500';
          bgStatus = 'bg-orange-50';
      } else if (isPresent) {
          // Get Shift
          const userShift = getShiftForDate(member.id, Date.now(), rosterAssignments, allUsers, shifts) || 
                            { startTime: '09:00', endTime: '18:00', gracePeriod: 15, name: 'General', id: 'GS', nightShift: false };

          const [sH, sM] = userShift.startTime.split(':').map(Number);
          const [eH, eM] = userShift.endTime.split(':').map(Number);
          
          const shiftStart = new Date();
          shiftStart.setHours(sH, sM, 0, 0);
          
          let shiftEnd = new Date();
          shiftEnd.setHours(eH, eM, 0, 0);
          if (userShift.nightShift && shiftEnd < shiftStart) {
              shiftEnd.setDate(shiftEnd.getDate() + 1);
          }
          
          const graceLimit = new Date(shiftStart.getTime() + userShift.gracePeriod * 60000);
          const isLate = punchIn && punchIn.timestamp > graceLimit.getTime();

          if (!punchOut) {
              // Only In
              if (isLate) {
                  displayStatus = 'Late In';
                  statusColor = 'text-orange-600';
                  bgStatus = 'bg-orange-50';
              } else {
                  displayStatus = 'Working';
                  statusColor = 'text-blue-600';
                  bgStatus = 'bg-blue-50';
              }
          } else {
              // Out exists
              const duration = punchOut.timestamp - punchIn!.timestamp;
              const shiftDuration = shiftEnd.getTime() - shiftStart.getTime();
              const isHalfDay = duration < (shiftDuration / 2);
              const isEarlyExit = punchOut.timestamp < shiftEnd.getTime();

              if (isHalfDay) {
                  displayStatus = 'Half Day';
                  statusColor = 'text-purple-600';
                  bgStatus = 'bg-purple-50';
              } else if (isLate) {
                  displayStatus = 'Late';
                  statusColor = 'text-orange-600';
                  bgStatus = 'bg-orange-50';
              } else if (isEarlyExit) {
                  displayStatus = 'Early Exit';
                  statusColor = 'text-yellow-600';
                  bgStatus = 'bg-yellow-50';
              } else {
                  displayStatus = 'Present';
                  statusColor = 'text-green-600';
                  bgStatus = 'bg-green-50';
              }
          }
      }

      return {
          ...member,
          status: displayStatus,
          statusColor,
          bgStatus,
          lastPunchTime: isPresent ? new Date((punchOut || punchIn!).timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
          performanceScore,
          lastPunch: punchOut || punchIn
      };
  });

  const presentCount = teamStatus.filter(m => m.status !== 'Absent' && m.status !== 'On Leave').length;
  
  const filteredMembers = teamStatus.filter(m => {
      if (filter === 'all') return true;
      if (filter === 'present') return m.status !== 'Absent' && m.status !== 'On Leave';
      if (filter === 'absent') return m.status === 'Absent';
      if (filter === 'leave') return m.status === 'On Leave';
      return true;
  });

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden pb-24">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-2 mb-4">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-slate-900">My Team</h2>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                <span className="block text-xl font-bold text-blue-700">{myTeam.length}</span>
                <span className="text-[10px] uppercase font-bold text-blue-400">Total</span>
            </div>
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                <span className="block text-xl font-bold text-green-700">{presentCount}</span>
                <span className="text-[10px] uppercase font-bold text-green-400">Present</span>
            </div>
            <div onClick={onNavigateToLeaves} className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center cursor-pointer active:scale-95 transition-transform">
                <span className="block text-xl font-bold text-orange-700">{pendingLeaves}</span>
                <span className="text-[10px] uppercase font-bold text-orange-400">Requests</span>
            </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setActiveTab('roster')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'roster' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Roster</button>
            <button onClick={() => setActiveTab('approvals')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Approvals {pendingRegularizations.length > 0 && `(${pendingRegularizations.length})`}</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {activeTab === 'roster' && (
              <>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Team Pulse</h3>
                    <div className="space-y-3">
                        {teamStatus.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center space-x-3">
                                <img src={m.avatar} className="w-8 h-8 rounded-full object-cover" alt={m.name} />
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-700">{m.name}</span><span className="text-slate-400">{m.performanceScore}% Reliability</span></div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${m.performanceScore > 90 ? 'bg-green-500' : m.performanceScore > 80 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{width: `${m.performanceScore}%`}}></div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800 text-sm">Team Roster</h3>
                        <div className="flex space-x-1">{['all', 'present'].map((f) => (<button key={f} onClick={() => setFilter(f as any)} className={`px-2 py-1 text-[10px] font-bold rounded capitalize ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}>{f}</button>))}</div>
                    </div>
                    <div className="space-y-3">
                        {filteredMembers.map(member => (
                            <div key={member.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <img src={member.avatar} className="w-10 h-10 rounded-full object-cover" alt={member.name} />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${member.status !== 'Absent' ? 'bg-green-500' : 'bg-slate-400'}`}>{member.status !== 'Absent' && <CheckCircleIcon className="w-2 h-2 text-white" />}</div>
                                    </div>
                                    <div><h4 className="text-sm font-bold text-slate-900">{member.name}</h4><p className="text-xs text-slate-500">{member.role}</p></div>
                                </div>
                                <div className="text-right">
                                    {member.status !== 'Absent' && member.status !== 'On Leave' ? (
                                        <>
                                            <div className={`flex items-center justify-end space-x-1 ${member.statusColor}`}>
                                                <ClockIcon className="w-3 h-3" />
                                                <span className="text-xs font-bold">{member.lastPunchTime}</span>
                                            </div>
                                            <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ${member.bgStatus} ${member.statusColor}`}>
                                                {member.status}
                                            </div>
                                        </>
                                    ) : (
                                        <div className={`flex items-center justify-end space-x-1 px-2 py-1 rounded ${member.bgStatus} ${member.statusColor}`}>
                                            <CalendarIcon className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">{member.status}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              </>
          )}

          {activeTab === 'approvals' && (
              <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                      <h3 className="text-purple-900 font-bold text-sm mb-1">Attendance Regularization</h3>
                      <p className="text-purple-600 text-xs">Review correction requests from your team.</p>
                  </div>
                  {pendingRegularizations.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">No pending requests.</div>
                  ) : (
                      <div className="space-y-3">
                          {pendingRegularizations.map(req => {
                              const requester = allUsers.find(u => u.id === req.userId);
                              return (
                                  <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                      <div className="flex items-start justify-between mb-3">
                                          <div className="flex items-center space-x-3">
                                              <img src={requester?.avatar} className="w-10 h-10 rounded-full" alt="User" />
                                              <div>
                                                  <div className="font-bold text-slate-800 text-sm">{requester?.name}</div>
                                                  <div className="text-xs text-slate-500">{new Date(req.date).toLocaleDateString()}</div>
                                              </div>
                                          </div>
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${req.type === AttendanceType.IN ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{req.type.replace('_', ' ')}</span>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-lg text-xs mb-3">
                                          <div className="flex justify-between mb-1"><span className="text-slate-500">Correct Time:</span><span className="font-mono font-bold">{new Date(req.newTime).toLocaleTimeString()}</span></div>
                                          <div className="flex justify-between"><span className="text-slate-500">Reason:</span><span className="font-medium">{req.reason}</span></div>
                                      </div>
                                      <div className="flex space-x-3">
                                          <button onClick={() => onRegularizationAction(req.id, 'Rejected')} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">Reject</button>
                                          <button onClick={() => onRegularizationAction(req.id, 'Approved')} className="flex-1 py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg">Approve & Update</button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default ManagerTeamView;
