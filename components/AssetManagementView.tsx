
import React, { useState } from 'react';
import { Asset, UserProfile, AssetCategory, AssetStatus, Ticket, AssetCondition } from '../types';
import { ChevronLeftIcon, PlusIcon, MonitorIcon, SmartphoneIcon, SimCardIcon, CpuIcon, LifeBuoyIcon, UsersIcon, CheckCircleIcon, RefreshIcon, XIcon, ClockIcon } from './Icons';

interface AssetManagementViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  assets: Asset[];
  onUpdateAssets: (assets: Asset[]) => void;
  onRaiseTicket: (ticket: Ticket) => void;
  onBack: () => void;
}

const AssetManagementView: React.FC<AssetManagementViewProps> = ({ currentUser, allUsers, assets, onUpdateAssets, onRaiseTicket, onBack }) => {
  const [activeTab, setActiveTab] = useState<'my_assets' | 'inventory' | 'requests'>('my_assets');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [workflowMode, setWorkflowMode] = useState<'none' | 'assign' | 'return'>('none');
  const [isReporting, setIsReporting] = useState<Asset | null>(null);

  // Form States
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetId, setNewAssetId] = useState('');
  const [newCategory, setNewCategory] = useState<AssetCategory>('Laptop');
  const [newSpecs, setNewSpecs] = useState('');
  
  const [assignUserId, setAssignUserId] = useState('');
  const [workflowDate, setWorkflowDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnCondition, setReturnCondition] = useState<string>('Good');

  // Issue Reporting States
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePriority, setIssuePriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const myAssets = assets.filter(a => a.assignedTo === currentUser.id);
  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const getIcon = (category: AssetCategory) => {
      switch(category) {
          case 'Laptop': return <MonitorIcon className="w-5 h-5 text-indigo-600" />;
          case 'Mobile': return <SmartphoneIcon className="w-5 h-5 text-blue-600" />;
          case 'SIM': return <SimCardIcon className="w-5 h-5 text-green-600" />;
          case 'ID_Card': return <UsersIcon className="w-5 h-5 text-orange-600" />;
          default: return <CpuIcon className="w-5 h-5 text-slate-600" />;
      }
  };

  const handleAddAsset = (e: React.FormEvent) => {
      e.preventDefault();
      const newAsset: Asset = {
          id: Date.now().toString(),
          assetId: newAssetId,
          name: newAssetName,
          category: newCategory,
          status: 'Available',
          condition: 'New',
          purchaseDate: Date.now(),
          history: [{ id: `evt_${Date.now()}`, date: Date.now(), type: 'Purchase' as const, description: 'Asset added to inventory', actorId: currentUser.id }],
          specifications: newSpecs
      };
      onUpdateAssets([...assets, newAsset]);
      setIsAdding(false);
      // Reset
      setNewAssetName(''); setNewAssetId(''); setNewSpecs('');
  };

  const handleAssignAsset = () => {
      if (!selectedAsset || !assignUserId) return;
      const updatedAssets = assets.map(a => {
          if (a.id === selectedAsset.id) {
              return {
                  ...a,
                  status: 'Assigned' as AssetStatus,
                  assignedTo: assignUserId,
                  assignedDate: new Date(workflowDate).getTime(),
                  history: [...a.history, {
                      id: `evt_${Date.now()}`,
                      date: new Date(workflowDate).getTime(),
                      type: 'Assignment' as const,
                      description: `Assigned to ${allUsers.find(u => u.id === assignUserId)?.name}`,
                      actorId: currentUser.id
                  }]
              };
          }
          return a;
      });
      onUpdateAssets(updatedAssets);
      setWorkflowMode('none');
      setAssignUserId('');
  };

  const handleReturnAsset = () => {
      if (!selectedAsset) return;
      const updatedAssets = assets.map(a => {
          if (a.id === selectedAsset.id) {
              return {
                  ...a,
                  status: 'Available' as AssetStatus,
                  condition: returnCondition as AssetCondition,
                  assignedTo: undefined,
                  assignedDate: undefined,
                  history: [...a.history, {
                      id: `evt_${Date.now()}`,
                      date: new Date(workflowDate).getTime(),
                      type: 'Return' as const,
                      description: `Returned. Condition: ${returnCondition}`,
                      actorId: currentUser.id
                  }]
              };
          }
          return a;
      });
      onUpdateAssets(updatedAssets);
      setWorkflowMode('none');
  };

  const submitIssueReport = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isReporting) return;

      const ticket: Ticket = {
          id: Date.now().toString(),
          userId: currentUser.id,
          subject: `Asset Issue: ${isReporting.name} (${isReporting.assetId})`,
          category: 'IT',
          priority: issuePriority,
          status: 'Open',
          date: Date.now()
      };
      
      const updatedAssets = assets.map(a => {
          if (a.id === isReporting.id) {
              return {
                  ...a,
                  history: [...a.history, {
                      id: `evt_${Date.now()}`,
                      date: Date.now(),
                      type: 'Report' as const,
                      description: `Issue Reported: ${issueDescription}`,
                      actorId: currentUser.id
                  }]
              }
          }
          return a;
      });
      onUpdateAssets(updatedAssets);

      // Trigger the parent callback which handles redirection to Helpdesk
      onRaiseTicket({ ...ticket, subject: ticket.subject + " - " + issueDescription });
      
      // Cleanup UI state
      setIsReporting(null);
      setIssueDescription('');
      setIssuePriority('Medium');
  };

  const handleGenericReport = () => {
      if (myAssets.length > 0) {
          setIsReporting(myAssets[0]);
      } else {
          alert("No assets assigned to report on. Please use the main Helpdesk for general IT requests.");
      }
  };

  if (isAdding) {
      return (
          <div className="bg-white h-full flex flex-col overflow-hidden pb-24">
              <div className="p-4 border-b border-slate-100 flex items-center space-x-2">
                  <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
                  <h2 className="text-xl font-bold text-slate-900">Add New Asset</h2>
              </div>
              <form onSubmit={handleAddAsset} className="p-4 space-y-4 flex-1 overflow-y-auto">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset ID / Tag</label><input required value={newAssetId} onChange={e => setNewAssetId(e.target.value)} className="w-full p-3 border rounded-xl text-sm" placeholder="e.g. IP-L-101" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model Name</label><input required value={newAssetName} onChange={e => setNewAssetName(e.target.value)} className="w-full p-3 border rounded-xl text-sm" placeholder="e.g. MacBook Air M2" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="w-full p-3 border rounded-xl text-sm bg-white">
                          {['Laptop', 'Mobile', 'SIM', 'ID_Card', 'Accessory', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Specs / Notes</label><textarea value={newSpecs} onChange={e => setNewSpecs(e.target.value)} className="w-full p-3 border rounded-xl text-sm h-24 resize-none" placeholder="Serial No, Config..." /></div>
                  <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg">Add to Inventory</button>
              </form>
          </div>
      )
  }

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden relative pb-24">
      <div className="bg-white p-4 border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-slate-900">Assets</h2>
            </div>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setActiveTab('my_assets')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'my_assets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>My Assets</button>
            {currentUser.isHR && <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Inventory</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {activeTab === 'my_assets' && (
              <>
                {myAssets.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">No assets assigned to you.</div> : myAssets.map(asset => (
                    <div key={asset.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">{getIcon(asset.category)}</div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{asset.name}</h4>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{asset.assetId}</p>
                                    <p className="text-[10px] text-slate-400 mt-2">Assigned: {new Date(asset.assignedDate!).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase">{asset.condition}</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                            <button onClick={() => setIsReporting(asset)} className="text-xs font-bold text-red-600 flex items-center space-x-1 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                <LifeBuoyIcon className="w-3 h-3" /><span>Report Issue</span>
                            </button>
                        </div>
                    </div>
                ))}
              </>
          )}

          {activeTab === 'inventory' && (
              <div className="space-y-3">
                  {assets.map(asset => (
                      <div key={asset.id} onClick={() => setSelectedAssetId(asset.id)} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition-colors">
                          <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">{getIcon(asset.category)}</div>
                              <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{asset.name}</h4>
                                  <div className="flex items-center space-x-2 text-xs">
                                      <span className="font-mono text-slate-500">{asset.assetId}</span>
                                      {asset.assignedTo && <span className="text-indigo-600 font-medium px-1.5 bg-indigo-50 rounded">@{allUsers.find(u => u.id === asset.assignedTo)?.name.split(' ')[0]}</span>}
                                  </div>
                              </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${asset.status === 'Available' ? 'bg-green-500' : asset.status === 'Assigned' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Floating Action Buttons */}
      {currentUser.isHR && activeTab === 'inventory' && (
          <button onClick={() => setIsAdding(true)} className="absolute bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-[60]">
              <PlusIcon className="w-6 h-6" />
          </button>
      )}

      {!currentUser.isHR && activeTab === 'my_assets' && (
          <button onClick={handleGenericReport} className="absolute bottom-28 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-[60]">
              <LifeBuoyIcon className="w-6 h-6" />
          </button>
      )}

      {/* REPORT ISSUE MODAL */}
      {isReporting && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
                      <div>
                          <h3 className="font-bold text-lg text-red-900">Report Issue</h3>
                          <p className="text-xs text-red-700">{isReporting.name} ({isReporting.assetId})</p>
                      </div>
                      <button onClick={() => setIsReporting(null)} className="p-1 hover:bg-red-100 rounded-full"><XIcon className="w-5 h-5 text-red-500" /></button>
                  </div>
                  <form onSubmit={submitIssueReport} className="p-4 space-y-4">
                      {/* Asset Selector (if reporting generic) */}
                      {myAssets.length > 1 && (
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Affected Asset</label>
                              <select 
                                value={isReporting.id} 
                                onChange={(e) => setIsReporting(assets.find(a => a.id === e.target.value) || isReporting)}
                                className="w-full p-2 border rounded-lg text-sm"
                              >
                                  {myAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetId})</option>)}
                              </select>
                          </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Priority</label>
                          <div className="flex space-x-2">
                              {(['Low', 'Medium', 'High'] as const).map(p => (
                                  <button type="button" key={p} onClick={() => setIssuePriority(p)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${issuePriority === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{p}</button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Issue Description</label>
                          <textarea required value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="Describe the problem (e.g. broken screen, software issue)..." rows={4} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none resize-none" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700">Submit Ticket</button>
                  </form>
              </div>
          </div>
      )}

      {/* Asset Detail Modal (Admin) */}
      {selectedAssetId && selectedAsset && currentUser.isHR && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="font-bold text-lg text-slate-900">{selectedAsset.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">{selectedAsset.assetId}</p>
                      </div>
                      <button onClick={() => { setSelectedAssetId(null); setWorkflowMode('none'); }} className="p-1 hover:bg-slate-200 rounded-full"><XIcon className="w-5 h-5 text-slate-500" /></button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto flex-1 space-y-6">
                      {/* Status Card */}
                      <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <div><span className="text-xs text-indigo-500 font-bold uppercase block">Current Status</span><span className="font-bold text-indigo-900">{selectedAsset.status}</span></div>
                          <div><span className="text-xs text-indigo-500 font-bold uppercase block">Condition</span><span className="font-bold text-indigo-900">{selectedAsset.condition}</span></div>
                      </div>

                      {/* WORKFLOW FORMS */}
                      {workflowMode === 'assign' && (
                          <div className="bg-white border border-blue-200 p-4 rounded-xl shadow-sm">
                              <h4 className="font-bold text-blue-800 text-sm mb-3">Assign Asset</h4>
                              <div className="space-y-3">
                                  <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
                                      <option value="">Select Employee...</option>
                                      {allUsers.filter(u => !assets.some(a => a.id === selectedAsset.id && a.assignedTo === u.id)).map(u => <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>)}
                                  </select>
                                  <input type="date" value={workflowDate} onChange={e => setWorkflowDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                  <div className="flex space-x-2 pt-2">
                                      <button onClick={() => setWorkflowMode('none')} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
                                      <button onClick={handleAssignAsset} disabled={!assignUserId} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">Confirm</button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {workflowMode === 'return' && (
                          <div className="bg-white border border-orange-200 p-4 rounded-xl shadow-sm">
                              <h4 className="font-bold text-orange-800 text-sm mb-3">Return Asset</h4>
                              <div className="space-y-3">
                                  <select value={returnCondition} onChange={e => setReturnCondition(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
                                      {['New', 'Good', 'Fair', 'Poor', 'Damaged'].map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  <input type="date" value={workflowDate} onChange={e => setWorkflowDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                  <div className="flex space-x-2 pt-2">
                                      <button onClick={() => setWorkflowMode('none')} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
                                      <button onClick={handleReturnAsset} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold">Confirm Return</button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Action Buttons */}
                      {workflowMode === 'none' && (
                          <div className="grid grid-cols-2 gap-3">
                              {selectedAsset.status === 'Available' ? (
                                  <button onClick={() => setWorkflowMode('assign')} className="py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow hover:bg-blue-700">Assign to User</button>
                              ) : (
                                  <button onClick={() => setWorkflowMode('return')} className="py-3 bg-orange-600 text-white rounded-xl font-bold text-sm shadow hover:bg-orange-700">Mark Returned</button>
                              )}
                              <button className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Edit Details</button>
                          </div>
                      )}

                      {/* History Timeline */}
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">History</h4>
                          <div className="space-y-4 pl-2 border-l-2 border-slate-100">
                              {selectedAsset.history.slice().reverse().map(event => (
                                  <div key={event.id} className="relative pl-4">
                                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                      <p className="text-xs font-bold text-slate-700">{event.type}</p>
                                      <p className="text-[10px] text-slate-500">{event.description}</p>
                                      <p className="text-[9px] text-slate-400 mt-0.5">{new Date(event.date).toLocaleDateString()}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AssetManagementView;
