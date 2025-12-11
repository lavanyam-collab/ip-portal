
import React from 'react';
import { UserProfile } from '../types';
import { ChevronDownIcon } from './Icons';

interface OrgHierarchyProps {
  targetUser: UserProfile;
  allUsers: UserProfile[];
}

const OrgHierarchy: React.FC<OrgHierarchyProps> = ({ targetUser, allUsers }) => {
  
  // Construct hierarchy: [L2?, L1?, Target]
  const hierarchy: UserProfile[] = [];

  // 1. Direct Manager
  const directManager = allUsers.find(u => u.id === targetUser.managerId);
  
  // 2. L2 Manager (Explicit or Implicit)
  let l2Manager = targetUser.managerL2Id 
    ? allUsers.find(u => u.id === targetUser.managerL2Id)
    : (directManager?.managerId ? allUsers.find(u => u.id === directManager.managerId) : undefined);

  // Avoid duplicates (e.g. if someone is their own manager or data is cyclic)
  if (l2Manager && l2Manager.id !== directManager?.id && l2Manager.id !== targetUser.id) {
      hierarchy.push(l2Manager);
  }

  if (directManager && directManager.id !== targetUser.id) {
      hierarchy.push(directManager);
  }

  hierarchy.push(targetUser);

  return (
    <div className="py-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
          <span className="bg-white pr-2">Reporting Hierarchy</span>
          <div className="h-px bg-slate-200 flex-1"></div>
      </h3>
      
      <div className="space-y-1">
        {hierarchy.map((user, index) => {
            const isTarget = user.id === targetUser.id;
            
            return (
                <div key={user.id} className="flex flex-col items-center">
                    {/* Render Down Arrow if not the first item */}
                    {index > 0 && (
                        <div className="py-1">
                            <ChevronDownIcon className="w-5 h-5 text-slate-300" />
                        </div>
                    )}

                    {/* Profile Card */}
                    <div className={`w-full flex items-center p-3 rounded-xl border transition-all ${
                        isTarget 
                        ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100' 
                        : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-100 mr-3 shadow-sm bg-slate-200" 
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className={`text-sm font-bold truncate ${isTarget ? 'text-blue-900' : 'text-slate-800'}`}>
                                    {user.name} {isTarget && '(You)'}
                                </h4>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                                    isTarget ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {user.level}
                                </span>
                            </div>
                            <p className={`text-xs truncate ${isTarget ? 'text-blue-600' : 'text-slate-500'}`}>{user.role}</p>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default OrgHierarchy;
