
import React, { useState } from 'react';
import { Ticket, UserProfile } from '../types';
import { PlusIcon, LifeBuoyIcon, ChevronLeftIcon, UsersIcon } from './Icons';

interface HelpdeskViewProps {
  tickets: Ticket[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onRaiseTicket: (ticket: Ticket) => void;
  onUpdateStatus: (ticketId: string, status: 'Resolved') => void;
  onBack: () => void;
}

const HelpdeskView: React.FC<HelpdeskViewProps> = ({ tickets, currentUser, allUsers, onRaiseTicket, onUpdateStatus, onBack }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'queue'>('my');
  const [isCreating, setIsCreating] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'IT' | 'HR' | 'Admin'>('IT');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const myTickets = tickets.filter(t => t.userId === currentUser.id);
  const queueTickets = tickets.filter(t => t.status === 'Open'); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
        id: Date.now().toString(),
        userId: currentUser.id,
        subject,
        category,
        priority,
        status: 'Open',
        date: Date.now()
    };
    onRaiseTicket(newTicket);
    setIsCreating(false);
    setSubject('');
  };

  const getUserName = (userId: string) => {
    return allUsers.find(u => u.id === userId)?.name || 'Unknown';
  };

  if (isCreating) {
      return (
          <div className="bg-white h-full flex flex-col overflow-hidden pb-24">
              <div className="p-4 border-b border-slate-100 flex items-center space-x-2 shrink-0">
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900">New Ticket</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                          <div className="flex space-x-2">
                              {(['IT', 'HR', 'Admin'] as const).map(c => (
                                  <button key={c} type="button" onClick={() => setCategory(c)} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{c}</button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Priority</label>
                          <div className="flex space-x-2">
                              {(['Low', 'Medium', 'High'] as const).map(p => (
                                  <button key={p} type="button" onClick={() => setPriority(p)} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${priority === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{p}</button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Issue Description</label>
                          <textarea required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Describe your issue..." rows={5} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none resize-none" />
                      </div>
                      <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg">Raise Ticket</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden relative pb-24">
      <div className="p-4 bg-white border-b border-slate-100 shrink-0 z-10">
          <div className="flex items-center space-x-2 mb-2">
              <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Helpdesk</h2>
          </div>
           {currentUser.isHR ? (
              <div className="flex p-1 bg-slate-100 rounded-xl mt-4">
                  <button onClick={() => setActiveTab('my')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>My Tickets</button>
                  <button onClick={() => setActiveTab('queue')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'queue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Queue {queueTickets.length > 0 && `(${queueTickets.length})`}</button>
              </div>
          ) : (
            <p className="text-sm text-slate-500">Track and manage your support requests.</p>
          )}
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto pb-24">
          {(activeTab === 'my' ? myTickets : queueTickets).slice().reverse().map(ticket => (
              <div key={ticket.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ticket.category === 'IT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{ticket.category}</span>
                      <span className={`text-[10px] font-medium ${ticket.status === 'Open' ? 'text-green-600' : 'text-slate-400'}`}>{ticket.status}</span>
                  </div>
                  {activeTab === 'queue' && (
                      <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-slate-600">
                          <UsersIcon className="w-3 h-3" />
                          <span>{getUserName(ticket.userId)}</span>
                      </div>
                  )}
                  <h3 className="font-bold text-slate-800 text-sm mb-2">{ticket.subject}</h3>
                  <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-2">
                      <span>{new Date(ticket.date).toLocaleDateString()}</span>
                      <span className="flex items-center">Priority: <span className={`ml-1 font-bold ${ticket.priority === 'High' ? 'text-red-500' : 'text-slate-500'}`}>{ticket.priority}</span></span>
                  </div>
                  {activeTab === 'queue' && ticket.status === 'Open' && (
                      <button onClick={() => onUpdateStatus(ticket.id, 'Resolved')} className="w-full mt-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800">Mark Resolved</button>
                  )}
              </div>
          ))}
          {(activeTab === 'my' ? myTickets : queueTickets).length === 0 && (
               <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
                   <LifeBuoyIcon className="w-12 h-12 opacity-20" />
                   <p>{activeTab === 'my' ? 'No tickets raised yet.' : 'Queue is empty!'}</p>
               </div>
          )}
      </div>

      {activeTab === 'my' && (
        <button onClick={() => setIsCreating(true)} className="absolute bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-[60]">
            <PlusIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default HelpdeskView;
