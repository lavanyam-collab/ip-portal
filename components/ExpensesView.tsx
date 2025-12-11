
import React, { useState, useRef, useEffect } from 'react';
import { ExpenseClaim, UserProfile, ExpenseCategory } from '../types';
import { PlusIcon, ReceiptIcon, ChevronLeftIcon, UploadIcon, XIcon, CheckCircleIcon, UsersIcon } from './Icons';

interface ExpensesViewProps {
  expenses: ExpenseClaim[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  initialTab?: 'my' | 'approvals';
  onAddExpense: (expense: ExpenseClaim) => void;
  onUpdateStatus: (id: string, status: 'Approved' | 'Rejected' | 'Pending_HR') => void;
  onBack: () => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, currentUser, allUsers, initialTab = 'my', onAddExpense, onUpdateStatus, onBack }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'approvals'>(initialTab);
  const [isApplying, setIsApplying] = useState(false);
  
  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);
  
  // Form
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Travel');
  const [desc, setDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myClaims = expenses.filter(e => e.userId === currentUser.id);
  
  // APPROVALS LOGIC
  const pendingApprovals = expenses.filter(e => {
      // 1. Manager Approval
      if (e.status === 'Pending_Manager') {
          const requester = allUsers.find(u => u.id === e.userId);
          return requester?.managerId === currentUser.id;
      }
      // 2. HR Approval (Second Level)
      if (e.status === 'Pending_HR') {
          return currentUser.isHR;
      }
      return false;
  });

  const canApprove = currentUser.isHR || allUsers.some(u => u.managerId === currentUser.id);

  // Determine Approver for current user
  const manager = allUsers.find(u => u.id === currentUser.managerId);
  const approverName = manager ? manager.name : "HR Department";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newClaim: ExpenseClaim = {
          id: Date.now().toString(),
          userId: currentUser.id,
          date: new Date(date).getTime(),
          amount: parseFloat(amount),
          category,
          description: desc,
          status: 'Pending_Manager', // Starts here
          appliedOn: Date.now(),
          attachmentUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined
      };
      onAddExpense(newClaim);
      setIsApplying(false);
      // Reset
      setAmount(''); setDate(''); setDesc(''); setSelectedFile(null);
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Approved': return 'bg-green-100 text-green-700';
          case 'Rejected': return 'bg-red-100 text-red-700';
          case 'Pending_HR': return 'bg-purple-100 text-purple-700';
          default: return 'bg-yellow-100 text-yellow-700';
      }
  };

  if (isApplying) {
      return (
          <div className="bg-white h-full flex flex-col overflow-hidden pb-24">
              <div className="p-4 border-b border-slate-100 flex items-center space-x-2 shrink-0">
                  <button onClick={() => setIsApplying(false)}><ChevronLeftIcon className="w-6 h-6 text-slate-400" /></button>
                  <h2 className="text-xl font-bold text-slate-900">New Claim</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                      
                      {/* Routing Info */}
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                          <div>
                              <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Request Routing</p>
                              <div className="flex items-center space-x-2">
                                  <p className="font-bold text-slate-800 text-sm">To: {approverName}</p>
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{manager ? 'Manager' : 'Admin'}</span>
                              </div>
                          </div>
                          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                              <UsersIcon className="w-5 h-5" />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount (₹)</label>
                          <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl text-2xl font-bold text-slate-800 bg-slate-50 outline-none" placeholder="0.00" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
                          <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-bold" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                          <div className="grid grid-cols-2 gap-2">
                              {['Travel', 'Food', 'Hotel', 'Office_Supplies', 'Internet', 'Other'].map(cat => (
                                  <button type="button" key={cat} onClick={() => setCategory(cat as ExpenseCategory)} className={`py-3 text-xs font-bold rounded-lg border ${category === cat ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-500 border-slate-200'}`}>{cat.replace('_', ' ')}</button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Purpose / Notes</label>
                          <textarea required value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none resize-none" placeholder="Client meeting lunch..." />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Proof of Expense</label>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />
                          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 cursor-pointer">
                              {selectedFile ? <><CheckCircleIcon className="w-8 h-8 text-green-500 mb-2" /><span className="text-xs font-bold text-slate-700">{selectedFile.name}</span></> : <><UploadIcon className="w-8 h-8 text-slate-300 mb-2" /><span className="text-xs font-bold text-slate-400">Upload Bill / Receipt</span></>}
                          </div>
                      </div>
                      <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg">Submit Claim</button>
                  </form>
              </div>
          </div>
      )
  }

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden relative pb-24">
      <div className="p-4 bg-white border-b border-slate-100 shrink-0 z-10">
          <div className="flex items-center space-x-2 mb-4">
              <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
          </div>
          {canApprove && (
              <div className="flex p-1 bg-slate-100 rounded-xl mb-2">
                  <button onClick={() => setActiveTab('my')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>My Claims</button>
                  <button onClick={() => setActiveTab('approvals')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Approvals {pendingApprovals.length > 0 && `(${pendingApprovals.length})`}</button>
              </div>
          )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {activeTab === 'my' ? (
              <>
                {myClaims.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">No expenses logged.</div> : myClaims.map(claim => (
                    <div key={claim.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center"><ReceiptIcon className="w-5 h-5" /></div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{claim.category.replace('_', ' ')}</h4>
                                <p className="text-xs text-slate-500">{claim.description}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(claim.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block font-bold text-slate-900">₹{claim.amount.toLocaleString()}</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${getStatusBadge(claim.status)}`}>{claim.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                ))}
              </>
          ) : (
              <>
                {pendingApprovals.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">No pending approvals.</div> : pendingApprovals.map(claim => {
                    const requester = allUsers.find(u => u.id === claim.userId);
                    const isHRApproval = claim.status === 'Pending_HR';
                    return (
                        <div key={claim.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-slate-50">
                                <img src={requester?.avatar} className="w-8 h-8 rounded-full" />
                                <div><h4 className="font-bold text-sm text-slate-800">{requester?.name}</h4><p className="text-xs text-slate-500">{new Date(claim.date).toLocaleDateString()}</p></div>
                                <span className={`ml-auto text-[10px] px-2 py-1 rounded bg-slate-100 font-bold uppercase ${isHRApproval ? 'text-purple-600' : 'text-orange-600'}`}>{isHRApproval ? 'L2 Approval' : 'L1 Approval'}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">{claim.category}</span>
                                    <p className="text-sm font-medium text-slate-700">{claim.description}</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900">₹{claim.amount}</span>
                            </div>
                            {claim.attachmentUrl && (
                                <a href={claim.attachmentUrl} target="_blank" className="text-xs text-blue-600 font-bold flex items-center space-x-1 mb-4 hover:underline"><UploadIcon className="w-3 h-3" /><span>View Attachment</span></a>
                            )}
                            <div className="flex space-x-3">
                                <button onClick={() => onUpdateStatus(claim.id, 'Rejected')} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">Reject</button>
                                <button onClick={() => onUpdateStatus(claim.id, isHRApproval ? 'Approved' : 'Pending_HR')} className="flex-1 py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg">{isHRApproval ? 'Final Approve' : 'Approve & Forward'}</button>
                            </div>
                        </div>
                    );
                })}
              </>
          )}
      </div>

      {activeTab === 'my' && !isApplying && (
        <button onClick={() => setIsApplying(true)} className="absolute bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-[60]">
            <PlusIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ExpensesView;
