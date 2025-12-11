
import React, { useState, useEffect } from 'react';
import { HomeIcon, ClockIcon, UsersIcon, GridIcon, CalendarIcon } from './components/Icons';
import PunchView from './components/PunchView';
import Dashboard from './components/Dashboard';
import UpdatesView from './components/UpdatesView';
import EmployeeDetail from './components/EmployeeDetail';
import DirectoryView from './components/DirectoryView';
import DocumentsView from './components/DocumentsView';
import LoginView from './components/LoginView';
import LeaveView from './components/LeaveView';
import HelpdeskView from './components/HelpdeskView';
import AppsView from './components/AppsView';
import RemindersView from './components/RemindersView';
import PayrollView from './components/PayrollView';
import HRMSView from './components/HRMSView';
import ManagerTeamView from './components/ManagerTeamView';
import AdminConsoleView from './components/AdminConsoleView';
import ExpensesView from './components/ExpensesView';
import AttendanceCalendarView from './components/AttendanceCalendarView';
import ActivityHistoryView from './components/ActivityHistoryView';
import NotificationCenterView from './components/NotificationCenterView';
import AssetManagementView from './components/AssetManagementView';
import RecycleBinView from './components/RecycleBinView';
import { StorageService, generateStructure, getShiftForDate } from './services/storage';
import { AttendanceRecord, EmployeeUpdate, Tab, UserProfile, Document, LeaveRequest, Ticket, ReminderConfig, PayrollRecord, AttendanceRegularization, ExpenseClaim, Holiday, Shift, AttendanceType, RosterAssignment, AppNotification, Asset } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [history, setHistory] = useState<Tab[]>([]); // Navigation Stack
  const [subTab, setSubTab] = useState<string | null>(null); 

  // Data State
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("u3");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [updates, setUpdates] = useState<EmployeeUpdate[]>([]);
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>({ enabled: false, startTime: '09:00', endTime: '18:00' });
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [regularizations, setRegularizations] = useState<AttendanceRegularization[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Connectivity Listener
  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // Async Data Loading Function
  const loadData = async () => {
      try {
          const [loadedUsers, loadedAttendance, loadedDocs, loadedLeaves, loadedTickets, loadedUpdates, loadedConfig, loadedPayroll, loadedRegularizations, loadedExpenses, loadedHolidays, loadedShifts, loadedRoster, loadedNotifications, loadedAssets] = await Promise.all([
              StorageService.getUsers(), StorageService.getAttendance(), StorageService.getDocuments(), StorageService.getLeaves(), StorageService.getTickets(), StorageService.getUpdates(), StorageService.getReminderConfig(), StorageService.getPayrollHistory(), StorageService.getRegularizations(), StorageService.getExpenses(), StorageService.getHolidays(), StorageService.getShifts(), StorageService.getRosterAssignments(), StorageService.getNotifications(), StorageService.getAssets()
          ]);
          setUsers(loadedUsers); setAttendanceHistory(loadedAttendance); setDocuments(loadedDocs); setLeaves(loadedLeaves); setTickets(loadedTickets); setUpdates(loadedUpdates); setReminderConfig(loadedConfig); setPayrollHistory(loadedPayroll); setRegularizations(loadedRegularizations); setExpenses(loadedExpenses); setHolidays(loadedHolidays); setShifts(loadedShifts); setRosterAssignments(loadedRoster); setNotifications(loadedNotifications); setAssets(loadedAssets);
      } catch (error) { console.error("Failed to load application data", error); }
  };

  useEffect(() => { const initApp = async () => { setIsLoading(true); await loadData(); setIsLoading(false); }; initApp(); }, []);

  // Request Notification Permission on Mount
  useEffect(() => {
      if ("Notification" in window && Notification.permission !== "granted") {
          Notification.requestPermission();
      }
  }, []);

  // Persistence Effects
  useEffect(() => { if(!isLoading) StorageService.saveAttendance(attendanceHistory); }, [attendanceHistory, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveUsers(users); }, [users, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveDocuments(documents); }, [documents, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveUpdates(updates); }, [updates, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveReminderConfig(reminderConfig); }, [reminderConfig, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveLeaves(leaves); }, [leaves, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveTickets(tickets); }, [tickets, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.savePayrollHistory(payrollHistory); }, [payrollHistory, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveRegularizations(regularizations); }, [regularizations, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveExpenses(expenses); }, [expenses, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveHolidays(holidays); }, [holidays, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveShifts(shifts); }, [shifts, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveRosterAssignments(rosterAssignments); }, [rosterAssignments, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveNotifications(notifications); }, [notifications, isLoading]);
  useEffect(() => { if(!isLoading) StorageService.saveAssets(assets); }, [assets, isLoading]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || {} as UserProfile;

  // --- NOTIFICATION ENGINE ---
  const sendSystemNotification = (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', category?: 'attendance' | 'leave' | 'expense' | 'payroll' | 'system', highPriority = false) => {
      const newNotification: AppNotification = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          userId,
          title,
          message,
          type,
          timestamp: Date.now(),
          read: false,
          category,
          sentViaEmail: highPriority // Simulate Email
      };
      setNotifications(prev => [newNotification, ...prev]);

      // Push Notification (If user is currently logged in or app is active)
      if (userId === currentUser.id && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: message, icon: '/logo192.png' });
      }
  };

  // --- NAVIGATION HANDLERS ---

  const switchTab = (tab: Tab) => {
      if (tab === activeTab) return;
      setHistory([]); 
      setActiveTab(tab);
      setSubTab(null);
      if (tab !== 'profile') setSelectedProfileId(null);
  };

  const navigateTo = (tab: Tab) => {
      setHistory(prev => [...prev, activeTab]);
      setActiveTab(tab);
      setSubTab(null);
  };

  const goBack = () => {
      if (history.length > 0) {
          const newHistory = [...history];
          const previousTab = newHistory.pop();
          setHistory(newHistory);
          if (previousTab) setActiveTab(previousTab);
      } else {
          if (activeTab !== 'home') switchTab('home');
      }
  };

  const handleLogin = (userId: string) => { setCurrentUserId(userId); setIsAuthenticated(true); switchTab('home'); };
  const handleLogout = () => { setIsAuthenticated(false); switchTab('home'); setSelectedProfileId(null); };
  
  const handleNavigateToApprovals = (category: 'leaves' | 'expenses' | 'attendance') => {
      setHistory(prev => [...prev, activeTab]);
      if (category === 'leaves') { setActiveTab('leaves'); setSubTab('approvals'); } 
      else if (category === 'expenses') { setActiveTab('expenses'); setSubTab('approvals'); } 
      else if (category === 'attendance') { setActiveTab('manager_team'); setSubTab('approvals'); }
  };

  const handleNotificationClick = (n: AppNotification) => {
      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
      switch (n.category) {
          case 'leave': if (n.title.toLowerCase().includes('request')) handleNavigateToApprovals('leaves'); else navigateTo('leaves'); break;
          case 'expense': if (n.title.toLowerCase().includes('claim')) handleNavigateToApprovals('expenses'); else navigateTo('expenses'); break;
          case 'attendance': if (n.title.toLowerCase().includes('regularization') && n.title.toLowerCase().includes('request') && (currentUser.isHR || users.some(u => u.managerId === currentUser.id))) handleNavigateToApprovals('attendance'); else navigateTo('attendance_calendar'); break;
          case 'payroll': navigateTo('payroll'); break;
          case 'system': if (n.title.toLowerCase().includes('ticket')) navigateTo('helpdesk'); else if (n.title.toLowerCase().includes('welcome')) navigateTo('company_buzz'); else if (n.title.toLowerCase().includes('action')) switchTab('home'); else if (n.title.toLowerCase().includes('contact')) navigateTo('profile'); break;
          default: break;
      }
  };

  const handlePunch = (record: Omit<AttendanceRecord, 'userId'>) => {
    let punchStatus: 'Regular' | 'Late' | 'Early Exit' | 'Half Day' = 'Regular';
    const userShift = getShiftForDate(currentUser.id, record.timestamp, rosterAssignments, users, shifts);
    const punchTime = new Date(record.timestamp);
    const setTimeOnDate = (date: Date, h: number, m: number) => { const d = new Date(date); d.setHours(h, m, 0, 0); return d; };

    if (userShift) {
        const [sH, sM] = userShift.startTime.split(':').map(Number);
        const [eH, eM] = userShift.endTime.split(':').map(Number);
        const shiftStart = setTimeOnDate(punchTime, sH, sM);
        let shiftEnd = setTimeOnDate(punchTime, eH, eM);
        if (userShift.nightShift && shiftEnd < shiftStart) {
            if (record.type === AttendanceType.OUT && punchTime.getHours() < 12) shiftStart.setDate(shiftStart.getDate() - 1);
            else shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        if (record.type === AttendanceType.IN) {
            const lateThreshold = new Date(shiftStart.getTime() + userShift.gracePeriod * 60000);
            if (punchTime > lateThreshold) punchStatus = 'Late';
        } else if (record.type === AttendanceType.OUT) {
            const lastRecord = attendanceHistory.filter(r => r.userId === currentUser.id && r.type === AttendanceType.IN).sort((a, b) => b.timestamp - a.timestamp)[0];
            if (lastRecord) {
                 const inTime = new Date(lastRecord.timestamp);
                 const sessionStart = setTimeOnDate(inTime, sH, sM);
                 let sessionEnd = setTimeOnDate(inTime, eH, eM);
                 if (userShift.nightShift && sessionEnd < sessionStart) sessionEnd.setDate(sessionEnd.getDate() + 1);
                 const sessionTotalDuration = sessionEnd.getTime() - sessionStart.getTime();
                 const workedDuration = punchTime.getTime() - lastRecord.timestamp;
                 if (workedDuration < (sessionTotalDuration / 2)) punchStatus = 'Half Day';
                 else if (punchTime < sessionEnd) punchStatus = 'Early Exit';
            }
        }
    }
    setAttendanceHistory(prev => [...prev, { ...record, userId: currentUser.id, status: punchStatus, shiftId: userShift?.id || 'GS' }]);
    sendSystemNotification(currentUser.id, `Attendance: ${record.type === AttendanceType.IN ? 'Clock In' : 'Clock Out'}`, `Recorded at ${punchTime.toLocaleTimeString()}. Status: ${punchStatus}`, 'success', 'attendance');
  };

  const handleAdminPunch = (userId: string, timestamp: number, type: AttendanceType) => {
      setAttendanceHistory(prev => [...prev, { id: Date.now().toString(), userId, type, timestamp, location: { lat: 0, lng: 0, address: 'Manual Admin Entry' }, photoUrl: '', status: 'Regular', shiftId: 'GS' }]);
      sendSystemNotification(userId, 'Admin Entry', 'An admin has manually marked your attendance.', 'warning', 'attendance');
  };

  const handleRegularization = (req: AttendanceRegularization) => {
      setRegularizations(prev => [...prev, req]);
      const requester = users.find(u => u.id === req.userId);
      if (requester?.managerId) {
          sendSystemNotification(requester.managerId, 'New Regularization Request', `${requester.name} requested regularization for ${new Date(req.date).toLocaleDateString()}.`, 'info', 'attendance');
      }
  };

  const handleRegularizationAction = (reqId: string, action: 'Approved' | 'Rejected') => {
      const req = regularizations.find(r => r.id === reqId);
      if (!req) return;
      setRegularizations(regularizations.map(r => r.id === reqId ? { ...r, status: action } : r));
      if (action === 'Approved') {
          setAttendanceHistory(prev => [...prev, { id: `reg_${req.id}`, userId: req.userId, type: req.type, timestamp: req.newTime, location: { lat: 0, lng: 0, address: 'Regularized Entry' }, photoUrl: '', remarks: `Regularized: ${req.reason}`, status: 'Regularized' }]);
      }
      sendSystemNotification(req.userId, `Regularization ${action}`, `Your request for ${new Date(req.date).toLocaleDateString()} was ${action.toLowerCase()}.`, action === 'Approved' ? 'success' : 'error', 'attendance', true);
  };

  const handleAddUpdate = (content: string, attachment?: { url: string, type: 'image' | 'video' | 'pdf', name: string }) => {
      setUpdates(prev => [{ id: Date.now().toString(), author: currentUser.name, avatar: currentUser.avatar, role: currentUser.role, content, timestamp: Date.now(), likes: 0, attachmentUrl: attachment?.url, attachmentType: attachment?.type, attachmentName: attachment?.name }, ...prev]);
  };

  const handleRequestLeave = (req: LeaveRequest) => {
      setLeaves([...leaves, req]);
      const requester = users.find(u => u.id === req.userId);
      const managerId = requester?.managerId;
      if (managerId) {
          sendSystemNotification(managerId, 'New Leave Request', `${requester?.name} requested ${req.type} from ${new Date(req.startDate).toLocaleDateString()}.`, 'info', 'leave', true);
      }
      sendSystemNotification(req.userId, 'Leave Applied', `Your request for ${req.type} has been submitted for approval.`, 'info', 'leave');
      navigateTo('leaves');
  };

  const handleUpdateLeaveStatus = (id: string, status: 'Approved' | 'Rejected') => {
      const req = leaves.find(l => l.id === id);
      setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
      if (req) {
          sendSystemNotification(req.userId, `Leave ${status}`, `Your leave request was ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'error', 'leave', true);
      }
  };

  const handleAddExpense = (e: ExpenseClaim) => {
      setExpenses([...expenses, e]);
      const requester = users.find(u => u.id === e.userId);
      const managerId = requester?.managerId;
      if (managerId) {
          sendSystemNotification(managerId, 'New Expense Claim', `${requester?.name} claimed ₹${e.amount} for ${e.category}.`, 'info', 'expense');
      }
  };

  const handleUpdateExpenseStatus = (id: string, status: 'Approved' | 'Rejected' | 'Pending_HR') => {
      const exp = expenses.find(e => e.id === id);
      const approvedDate = status === 'Approved' ? Date.now() : undefined;
      setExpenses(expenses.map(e => e.id === id ? { ...e, status, approvedDate } : e));
      if (exp) {
          if (status === 'Pending_HR') {
              sendSystemNotification(exp.userId, 'Expense Update', 'Your claim has been approved by manager and forwarded to HR.', 'info', 'expense');
          } else {
              sendSystemNotification(exp.userId, `Expense ${status}`, `Your claim for ₹${exp.amount} was ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'error', 'expense', true);
          }
      }
  };

  const handleGeneratePayslips = (newRecs: PayrollRecord[], newDocs: Document[]) => {
      setPayrollHistory([...payrollHistory, ...newRecs]);
      setDocuments([...documents, ...newDocs]);
      newRecs.forEach(rec => {
          sendSystemNotification(rec.employeeId, 'Payslip Generated', `Payslip for ${rec.month} is now available.`, 'success', 'payroll', true);
      });
  };

  const handleRaiseTicket = (t: Ticket) => {
      setTickets([...tickets, t]);
      const admins = users.filter(u => u.isHR);
      admins.forEach(admin => {
          sendSystemNotification(admin.id, 'New Support Ticket', `Category: ${t.category}. Priority: ${t.priority}.`, 'warning', 'system');
      });
      navigateTo('helpdesk');
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleAddUser = (newUser: UserProfile) => setUsers(prev => [...prev, newUser]);
  
  // --- USER LIFECYCLE MANAGEMENT ---
  const handleSoftDeleteUser = (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Deleted' } : u));
  };

  const handleRestoreUser = (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Active' } : u));
  };

  const handlePurgeUser = (userId: string) => {
      if (window.confirm("Permanently delete this user and all their data? This cannot be undone.")) {
          setUsers(prev => prev.filter(u => u.id !== userId));
      }
  };

  // --- DOCUMENT LIFECYCLE MANAGEMENT ---
  const handleSoftDeleteDocument = (docId: string) => {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isDeleted: true } : d));
  };

  const handleRestoreDocument = (docId: string) => {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isDeleted: false } : d));
  };

  const handlePurgeDocument = (docId: string) => {
      if (window.confirm("Permanently delete this document?")) {
          setDocuments(prev => prev.filter(d => d.id !== docId));
      }
  };

  // --- LOGIN VIEW ---
  // Renders strictly full-height/width on mobile, and centered with max-width on desktop.
  if (!isAuthenticated) return (
      <div className="h-[100dvh] w-full bg-slate-100 flex items-center justify-center p-0 md:p-4">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl overflow-hidden relative">
              <LoginView onLogin={handleLogin} users={users.filter(u => u.status !== 'Deleted')} />
          </div>
      </div>
  );

  const renderContent = () => {
      // SECURE ROUTING: Enforce RBAC
      if (activeTab === 'admin_console' || activeTab === 'hrms' || activeTab === 'recycle_bin') {
          if (!currentUser.isHR) {
              alert("Access Denied: Admin privileges required.");
              setActiveTab('home');
              return null;
          }
      }
      if (activeTab === 'manager_team') {
          const isManager = users.some(u => u.managerId === currentUser.id) || currentUser.isHR;
          if (!isManager) {
              alert("Access Denied: Manager privileges required.");
              setActiveTab('home');
              return null;
          }
      }

      switch(activeTab) {
          case 'home': return <Dashboard user={currentUser} allUsers={users.filter(u => u.status !== 'Deleted')} leaves={leaves} attendanceHistory={attendanceHistory} expenses={expenses} tickets={tickets} documents={documents.filter(d => !d.isDeleted)} regularizations={regularizations} updates={updates} holidays={holidays} notifications={notifications.filter(n => n.userId === currentUser.id)}
            onNavigateToPunch={() => switchTab('punch')} 
            onNavigateToDirectory={() => switchTab('directory')} 
            onNavigateToDocuments={() => navigateTo('documents')} 
            onNavigateToLeaves={() => navigateTo('leaves')} 
            onNavigateToAttendance={() => navigateTo('attendance_calendar')} 
            onNavigateToActivityHistory={() => navigateTo('activity_history')} 
            onNavigateToCompanyBuzz={() => navigateTo('company_buzz')} 
            onNavigateToHelpdesk={() => navigateTo('helpdesk')} 
            onNavigateToApprovals={handleNavigateToApprovals} 
            onNavigateToNotifications={() => navigateTo('notifications')}
          />;
          case 'punch': return <PunchView lastPunch={attendanceHistory.filter(r => r.userId === currentUser.id).sort((a,b) => a.timestamp - b.timestamp).pop() || null} history={attendanceHistory.filter(r => r.userId === currentUser.id)} currentUser={currentUser} userShift={getShiftForDate(currentUser.id, Date.now(), rosterAssignments, users, shifts)} onPunch={handlePunch} onRegularize={handleRegularization} />;
          case 'apps': return <AppsView user={currentUser} onNavigate={(view) => navigateTo(view)} onLogout={handleLogout} />;
          case 'directory': return <DirectoryView users={users.filter(u => u.status !== 'Deleted')} currentUser={currentUser} 
            onSelectUser={(u) => { setSelectedProfileId(u.id); navigateTo('profile'); }} 
            onAddUser={currentUser.isHR ? handleAddUser : undefined} 
            onUpdateUser={handleUpdateProfile}
            onDeleteUser={handleSoftDeleteUser} 
            onBack={history.length > 0 ? goBack : undefined}
          />;
          case 'documents': return <DocumentsView documents={documents.filter(d => !d.isDeleted)} currentUser={currentUser} allUsers={users.filter(u => u.status !== 'Deleted')} onUpload={(doc) => setDocuments([...documents, doc])} onBack={goBack} onDelete={handleSoftDeleteDocument} />;
          case 'profile': return <EmployeeDetail employee={selectedProfileId ? users.find(u => u.id === selectedProfileId) || currentUser : currentUser} currentUser={currentUser} allUsers={users} shifts={shifts} onUpdate={handleUpdateProfile} onBack={history.length > 0 ? goBack : undefined} />;
          case 'leaves': return <LeaveView requests={leaves} currentUser={currentUser} allUsers={users} initialTab={subTab === 'approvals' ? 'approvals' : 'my'} onRequestLeave={handleRequestLeave} onUpdateStatus={handleUpdateLeaveStatus} onBack={goBack} />;
          case 'helpdesk': return <HelpdeskView tickets={tickets} currentUser={currentUser} allUsers={users} onRaiseTicket={handleRaiseTicket} onUpdateStatus={(id, status) => setTickets(tickets.map(t => t.id === id ? { ...t, status } : t))} onBack={goBack} />;
          case 'reminders': return <RemindersView config={reminderConfig} onSave={setReminderConfig} onBack={goBack} />;
          case 'payroll': return <PayrollView user={currentUser} documents={documents.filter(d => !d.isDeleted)} payrollHistory={payrollHistory} onBack={goBack} />;
          case 'hrms': return <HRMSView currentUser={currentUser} users={users.filter(u => u.status !== 'Deleted')} attendanceHistory={attendanceHistory} leaves={leaves} tickets={tickets} payrollHistory={payrollHistory} expenses={expenses} holidays={holidays} shifts={shifts} rosterAssignments={rosterAssignments} 
            onBack={goBack} 
            onNavigateToDirectory={() => switchTab('directory')} 
            onNavigateToLeaves={() => navigateTo('leaves')} 
            onNavigateToHelpdesk={() => navigateTo('helpdesk')} 
            onGeneratePayslips={handleGeneratePayslips} 
          />;
          case 'manager_team': return <ManagerTeamView currentUser={currentUser} allUsers={users.filter(u => u.status !== 'Deleted')} attendanceHistory={attendanceHistory} leaves={leaves} regularizations={regularizations} shifts={shifts} rosterAssignments={rosterAssignments} initialTab={subTab === 'approvals' ? 'approvals' : 'roster'} onBack={goBack} onNavigateToLeaves={() => navigateTo('leaves')} onRegularizationAction={handleRegularizationAction} />;
          case 'admin_console': return <AdminConsoleView users={users} attendanceHistory={attendanceHistory} leaves={leaves} payrollHistory={payrollHistory} holidays={holidays} shifts={shifts} assets={assets} documents={documents} tickets={tickets} expenses={expenses} onRefresh={() => loadData()} onBack={goBack} onUpdateHolidays={setHolidays} onUpdateShifts={setShifts} onAssignRoster={(userIds, shiftId, effectiveDate, endDate) => { const newAssignments: RosterAssignment[] = []; const start = new Date(effectiveDate); const end = new Date(endDate || effectiveDate); for (let d = start; d <= end; d.setDate(d.getDate() + 1)) { const dateStr = d.toISOString().split('T')[0]; userIds.forEach(uid => { if (rosterAssignments.findIndex(r => r.userId === uid && r.date === dateStr) === -1) { newAssignments.push({ id: `${uid}_${dateStr}_${Date.now()}`, userId: uid, shiftId: shiftId, date: dateStr }); } }); } setRosterAssignments(prev => [...prev.filter(p => !newAssignments.some(n => n.userId === p.userId && n.date === p.date)), ...newAssignments]); }} onAdminPunch={handleAdminPunch} />;
          case 'expenses': return <ExpensesView expenses={expenses} currentUser={currentUser} allUsers={users} initialTab={subTab === 'approvals' ? 'approvals' : 'my'} onAddExpense={handleAddExpense} onUpdateStatus={handleUpdateExpenseStatus} onBack={goBack} />;
          case 'attendance_calendar': return <AttendanceCalendarView user={currentUser} attendanceHistory={attendanceHistory} leaves={leaves} holidays={holidays} onBack={goBack} />;
          case 'activity_history': return <ActivityHistoryView user={currentUser} attendanceHistory={attendanceHistory} leaves={leaves} expenses={expenses} tickets={tickets} documents={documents.filter(d => !d.isDeleted)} onBack={goBack} />;
          case 'company_buzz': return <UpdatesView updates={updates} currentUser={currentUser} onAddUpdate={handleAddUpdate} onBack={goBack} />;
          case 'notifications': return <NotificationCenterView notifications={notifications.filter(n => n.userId === currentUser.id)} onMarkRead={(id) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setNotifications(notifications.filter(n => n.userId !== currentUser.id))} onBack={goBack} onAction={handleNotificationClick} />;
          case 'assets': return <AssetManagementView currentUser={currentUser} allUsers={users.filter(u => u.status !== 'Deleted')} assets={assets} onUpdateAssets={setAssets} onRaiseTicket={handleRaiseTicket} onBack={goBack} />;
          case 'recycle_bin': return <RecycleBinView users={users} documents={documents} onBack={goBack} onUpdateUser={handleUpdateProfile} onDeleteUser={handleSoftDeleteUser} onRestoreUser={handleRestoreUser} onPurgeUser={handlePurgeUser} onRestoreDocument={handleRestoreDocument} onPurgeDocument={handlePurgeDocument} />;
          default: return null;
      }
  };

  const showNav = isAuthenticated; 

  return (
    <div className="h-[100dvh] w-full bg-slate-100 flex justify-center items-start overflow-hidden">
      {/* 
        MAIN APP CONTAINER 
        - Full Height (100dvh)
        - Max-width constrained on desktop for proper app feel
        - Centered
      */}
      <div className="w-full max-w-lg h-full bg-slate-50 relative shadow-2xl flex flex-col overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 w-full overflow-hidden relative">
              {renderContent()}
          </div>

          {/* Navigation Bar - Stays inside the container */}
          {showNav && (
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-[65px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-pb">
              <div className="grid grid-cols-5 items-center h-full w-full">
                <button onClick={() => switchTab('home')} className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full ${activeTab === 'home' ? 'text-slate-900' : 'text-slate-400'}`}>
                  <HomeIcon className={`w-5 h-5 ${activeTab === 'home' ? 'fill-current' : ''}`} />
                  <span className="text-[9px] font-bold">Home</span>
                </button>
                <button onClick={() => switchTab('apps')} className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full ${activeTab === 'apps' ? 'text-slate-900' : 'text-slate-400'}`}>
                  <GridIcon className={`w-5 h-5 ${activeTab === 'apps' ? 'fill-current' : ''}`} />
                  <span className="text-[9px] font-bold">Apps</span>
                </button>
                <button onClick={() => switchTab('punch')} className={`flex flex-col items-center justify-center space-y-1 -mt-6 relative z-20 w-full ${activeTab === 'punch' ? 'scale-110' : ''}`}>
                  <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-slate-300 active:scale-95 transition-transform">
                      <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-900">Punch</span>
                </button>
                <button onClick={() => switchTab('directory')} className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full ${activeTab === 'directory' ? 'text-slate-900' : 'text-slate-400'}`}>
                  <UsersIcon className={`w-5 h-5 ${activeTab === 'directory' ? 'fill-current' : ''}`} />
                  <span className="text-[9px] font-bold">Team</span>
                </button>
                <button onClick={() => { setSelectedProfileId(null); switchTab('profile'); }} className={`flex flex-col items-center justify-center space-y-1 transition-all w-full ${activeTab === 'profile' ? 'text-slate-900' : 'text-slate-400'}`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-current">
                        <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] font-bold">Me</span>
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default App;
