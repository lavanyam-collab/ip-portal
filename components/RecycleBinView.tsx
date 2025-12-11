
import React from 'react';
import { UserProfile, Document } from '../types';
import { ChevronLeftIcon, TrashIcon, RotateCcwIcon, UsersIcon, FileTextIcon, BanIcon, CheckCircleIcon } from './Icons';

interface RecycleBinViewProps {
  users: UserProfile[];
  documents: Document[];
  onBack: () => void;
  // User Management
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onRestoreUser: (userId: string) => void;
  onPurgeUser: (userId: string) => void;
  // Document Management
  onRestoreDocument: (docId: string) => void;
  onPurgeDocument: (docId: string) => void;
}

const RecycleBinView: React.FC<RecycleBinViewProps> = ({
  users, documents, onBack, onUpdateUser, onDeleteUser, onRestoreUser, onPurgeUser, onRestoreDocument, onPurgeDocument
}) => {
  const deactivatedUsers = users.filter(u => u.status === 'Inactive');
  const deletedUsers = users.filter(u => u.status === 'Deleted');
  const deletedDocs = documents.filter(d => d.isDeleted);

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden pb-24 relative">
      {/* Header */}
      <div className="bg-white p-4 border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-2">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-slate-900">Recycle Bin</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Deactivated Staff Section */}
          <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
                  <BanIcon className="w-5 h-5 text-orange-500" />
                  <h3>Deactivated Staff</h3>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {deactivatedUsers.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">No deactivated users.</div>
                  ) : (
                      <div className="divide-y divide-slate-100">
                          {deactivatedUsers.map(u => (
                              <div key={u.id} className="p-4 flex justify-between items-center bg-orange-50/30">
                                  <div>
                                      <div className="font-bold text-slate-800 text-sm">{u.name}</div>
                                      <div className="text-xs text-slate-500">{u.role} • {u.employeeId}</div>
                                  </div>
                                  <div className="flex space-x-2">
                                      <button 
                                          onClick={() => onUpdateUser({ ...u, status: 'Active' })}
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Reactivate"
                                      >
                                          <CheckCircleIcon className="w-4 h-4" />
                                      </button>
                                      <button 
                                          onClick={() => onDeleteUser(u.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Move to Bin"
                                      >
                                          <TrashIcon className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* Deleted Staff Bin */}
          <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
                  <UsersIcon className="w-5 h-5" />
                  <h3>Deleted Staff</h3>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {deletedUsers.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">Bin is empty.</div>
                  ) : (
                      <div className="divide-y divide-slate-100">
                          {deletedUsers.map(u => (
                              <div key={u.id} className="p-4 flex justify-between items-center bg-slate-50/50">
                                  <div>
                                      <div className="font-bold text-slate-800 text-sm">{u.name}</div>
                                      <div className="text-xs text-slate-500">{u.role} • {u.employeeId}</div>
                                  </div>
                                  <div className="flex space-x-2">
                                      <button 
                                          onClick={() => onRestoreUser(u.id)}
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Restore"
                                      >
                                          <RotateCcwIcon className="w-4 h-4" />
                                      </button>
                                      <button 
                                          onClick={() => onPurgeUser(u.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete Permanently"
                                      >
                                          <TrashIcon className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* Document Bin */}
          <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
                  <FileTextIcon className="w-5 h-5" />
                  <h3>Deleted Files</h3>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {deletedDocs.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">Bin is empty.</div>
                  ) : (
                      <div className="divide-y divide-slate-100">
                          {deletedDocs.map(d => (
                              <div key={d.id} className="p-4 flex justify-between items-center bg-slate-50/50">
                                  <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0"><FileTextIcon className="w-4 h-4" /></div>
                                      <div>
                                          <div className="font-bold text-slate-800 text-sm">{d.title}</div>
                                          <div className="text-xs text-slate-500">{d.size} • {new Date(d.date).toLocaleDateString()}</div>
                                      </div>
                                  </div>
                                  <div className="flex space-x-2">
                                      <button 
                                          onClick={() => onRestoreDocument(d.id)}
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Restore"
                                      >
                                          <RotateCcwIcon className="w-4 h-4" />
                                      </button>
                                      <button 
                                          onClick={() => onPurgeDocument(d.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete Permanently"
                                      >
                                          <TrashIcon className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default RecycleBinView;
