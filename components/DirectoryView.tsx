
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronRightIcon, PlusIcon, UsersIcon, ChevronLeftIcon, XIcon, CheckCircleIcon, TrashIcon, BanIcon } from './Icons';

interface DirectoryViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onAddUser?: (user: UserProfile) => void;
  onUpdateUser?: (user: UserProfile) => void;
  onDeleteUser?: (userId: string) => void;
  onBack?: () => void;
}

const DirectoryView: React.FC<DirectoryViewProps> = ({ users, currentUser, onSelectUser, onAddUser, onUpdateUser, onDeleteUser, onBack }) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'team'>('all');
  
  // New User Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newJoiningDate, setNewJoiningDate] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newManagerId, setNewManagerId] = useState('');
  const [newManagerL2Id, setNewManagerL2Id] = useState('');
  const [newLevel, setNewLevel] = useState('L1');

  const hasAccessToViewAll = currentUser.isHR;
  const isManager = users.some(u => u.managerId === currentUser.id);

  const filteredUsers = users.filter(u => {
    if (viewMode === 'team' && u.managerId !== currentUser.id) return false;
    const term = search.toLowerCase();
    if (hasAccessToViewAll || (isManager && viewMode === 'team')) {
         return u.name.toLowerCase().includes(term) || u.employeeId.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
    }
    if (!term) return false;
    return u.employeeId.toLowerCase().includes(term);
  });

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onAddUser) return;
      const nextIdNumber = 1000 + users.length + 1;
      const newEmployeeId = `IP-${nextIdNumber}`;
      const newUser: UserProfile = {
          id: Date.now().toString(),
          employeeId: newEmployeeId,
          name: newName,
          role: newRole,
          email: newEmail,
          phone: newPhone,
          department: newDepartment || 'General',
          level: newLevel,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=random`,
          location: 'Office',
          managerId: newManagerId || currentUser.id, // Use selected manager or default to creator
          managerL2Id: newManagerL2Id || null,
          isHR: false,
          gender: newGender,
          password: newPassword,
          joiningDate: newJoiningDate ? new Date(newJoiningDate).getTime() : Date.now(),
          salary: 600000 
      };
      onAddUser(newUser);
      setIsAdding(false);
      resetForm();
  };

  const handleStatusChange = (e: React.MouseEvent, user: UserProfile, newStatus: 'Active' | 'Inactive') => {
      e.stopPropagation(); // Critical stop propagation
      if (onUpdateUser) {
          onUpdateUser({ ...user, status: newStatus });
      }
  };

  const handleDelete = (e: React.MouseEvent, userId: string) => {
      e.stopPropagation(); // Critical stop propagation
      if (onDeleteUser) {
          onDeleteUser(userId);
      }
  };

  const resetForm = () => { setNewName(''); setNewRole(''); setNewDepartment(''); setNewEmail(''); setNewPhone(''); setNewPassword(''); setNewJoiningDate(''); setNewGender('Male'); setNewManagerId(''); setNewManagerL2Id(''); setNewLevel('L1'); };

  if (isAdding) {
      return (
          <div className="p-4 bg-white h-full animate-fade-in flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-xl font-bold text-slate-900">Create Employee Master</h2>
                  <button onClick={() => setIsAdding(false)} className="text-sm text-slate-500 font-medium">Cancel</button>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl mb-6 flex items-start space-x-3 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><PlusIcon className="w-4 h-4" /></div>
                  <div><h3 className="text-sm font-bold text-blue-900">New Account Setup</h3><p className="text-xs text-blue-700 mt-1">This will generate a unique Employee ID. Use the Employee Detail view to add Bank & Salary info later.</p></div>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4 flex-1 overflow-y-auto pb-24">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label><input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Doe" /></div>
                  <div className="flex space-x-3"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Role</label><input required value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Designer" /></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label><input required value={newDepartment} onChange={e => setNewDepartment(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Sales" /></div></div>
                  
                  {/* Hierarchy Definition */}
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Level / Grade</label>
                          <select 
                            value={newLevel} 
                            onChange={e => setNewLevel(e.target.value)} 
                            className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                          >
                              <option value="L1">L1 - Associate</option>
                              <option value="L2">L2 - Senior</option>
                              <option value="M1">M1 - Manager</option>
                              <option value="M2">M2 - Senior Mgr</option>
                              <option value="D1">D1 - Director</option>
                              <option value="VP">VP / CXO</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reporting Manager (L1)</label>
                          <select 
                            value={newManagerId} 
                            onChange={e => setNewManagerId(e.target.value)} 
                            className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                          >
                              <option value="">No Manager (Top Level)</option>
                              {users.filter(u => u.status !== 'Deleted' && u.status !== 'Inactive').map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.level})</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  {/* L2 Manager Selection */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Level 2 Manager (Manager's Manager)</label>
                      <select 
                        value={newManagerL2Id} 
                        onChange={e => setNewManagerL2Id(e.target.value)} 
                        className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      >
                          <option value="">No L2 Manager</option>
                          {users.filter(u => u.status !== 'Deleted' && u.status !== 'Inactive' && u.id !== newManagerId).map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.level})</option>
                          ))}
                      </select>
                  </div>

                  <div className="flex space-x-3"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label><select value={newGender} onChange={e => setNewGender(e.target.value as any)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Joining Date</label><input required type="date" value={newJoiningDate} onChange={e => setNewJoiningDate(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label><input required type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 98765 43210" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Official Email</label><input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. john@interiorplus.com" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Password</label><input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Create a temporary password" /><p className="text-[10px] text-slate-400 mt-1">The employee can change this after their first login.</p></div>
                  <div className="pt-4"><button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">Create Account & Generate ID</button></div>
              </form>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-white relative pb-24">
      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center space-x-2 mb-4">
            {onBack && (
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            )}
            <div className="flex-1 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Directory</h2>
                {hasAccessToViewAll && (
                    <button onClick={() => setIsAdding(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-full shadow-lg text-xs font-bold">
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Employee</span>
                    </button>
                )}
            </div>
        </div>
        {isManager && (
            <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                <button onClick={() => setViewMode('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>All Staff</button>
                <button onClick={() => setViewMode('team')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>My Team</button>
            </div>
        )}
        <div className="relative">
            <input type="text" placeholder={hasAccessToViewAll || (isManager && viewMode === 'team') ? "Search name..." : "Enter Employee ID..."} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!hasAccessToViewAll && !search && viewMode !== 'team' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 px-8 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center"><UsersIcon className="w-8 h-8 text-slate-300" /></div>
                <p className="text-sm">Employee privacy is protected.<br/>Please search by <b>Employee ID</b> to find a colleague.</p>
            </div>
        )}
        {filteredUsers.map(user => {
            const isActive = user.status !== 'Inactive';
            const showActions = currentUser.isHR && user.id !== currentUser.id;
            
            return (
            <div key={user.id} onClick={() => onSelectUser(user)} className={`w-full p-3 flex items-center space-x-3 hover:bg-slate-50 rounded-xl transition-colors text-left border-b border-slate-50 last:border-0 cursor-pointer group relative ${!isActive ? 'opacity-70 bg-slate-50' : ''}`}>
                <div className="relative shrink-0">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-slate-100 group-hover:scale-105 transition-transform" />
                    {!isActive && <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center"><BanIcon className="w-6 h-6 text-slate-400" /></div>}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{user.name} {user.id === currentUser.id && '(You)'}</h3>
                        {isActive ? (
                             <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                        ) : (
                             <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    <p className="text-[10px] text-orange-600 font-mono mt-0.5">{user.employeeId}</p>
                </div>

                {showActions ? (
                    <div className="flex items-center space-x-2 relative z-20" onClick={(e) => e.stopPropagation()}>
                        {/* Status Toggle */}
                        {isActive ? (
                            <button 
                                type="button"
                                onClick={(e) => handleStatusChange(e, user, 'Inactive')} 
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors active:scale-95"
                                title="Deactivate Account"
                            >
                                <BanIcon className="w-5 h-5 pointer-events-none" />
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={(e) => handleStatusChange(e, user, 'Active')} 
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors active:scale-95"
                                title="Reactivate Account"
                            >
                                <CheckCircleIcon className="w-5 h-5 pointer-events-none" />
                            </button>
                        )}
                        
                        {/* Soft Delete */}
                        <button 
                            type="button"
                            onClick={(e) => handleDelete(e, user.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                            title="Move to Bin"
                        >
                            <TrashIcon className="w-5 h-5 pointer-events-none" />
                        </button>
                    </div>
                ) : (
                    <>
                        {user.isHR && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">Admin</span>}
                        <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                    </>
                )}
            </div>
        )})}
        {filteredUsers.length === 0 && (hasAccessToViewAll || search || viewMode === 'team') && (
            <div className="text-center py-12 text-slate-400 text-sm">No employees found matching "{search}".</div>
        )}
      </div>
    </div>
  );
};

export default DirectoryView;