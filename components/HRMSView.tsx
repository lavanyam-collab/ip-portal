
import React, { useState } from 'react';
import { UserProfile, AttendanceRecord, LeaveRequest, Ticket, AttendanceType, Document, PayrollRecord, ExpenseClaim, Holiday, Shift, RosterAssignment } from '../types';
import { ChartBarIcon, UsersIcon, CheckCircleIcon, LifeBuoyIcon, ChevronLeftIcon, PlusIcon, CurrencyIcon } from './Icons';
import { generateStructure, StorageService, generatePayslipHTML, getShiftForDate } from '../services/storage';

interface HRMSViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  attendanceHistory: AttendanceRecord[];
  leaves: LeaveRequest[];
  tickets: Ticket[];
  payrollHistory: PayrollRecord[];
  expenses?: ExpenseClaim[];
  holidays?: Holiday[]; 
  shifts?: Shift[]; 
  rosterAssignments?: RosterAssignment[];
  onBack: () => void;
  onNavigateToDirectory: () => void;
  onNavigateToLeaves: () => void;
  onNavigateToHelpdesk: () => void;
  onGeneratePayslips: (records: PayrollRecord[], documents: Document[]) => void;
}

const HRMSView: React.FC<HRMSViewProps> = ({ 
  currentUser, users, attendanceHistory, leaves, tickets, payrollHistory, expenses = [], holidays = [], shifts = [], rosterAssignments = [], onBack, 
  onNavigateToDirectory, onNavigateToLeaves, onNavigateToHelpdesk, onGeneratePayslips 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'payroll'>('dashboard');
  const [generating, setGenerating] = useState(false);

  // --- STATS CALCULATION ---
  const today = new Date().setHours(0,0,0,0);
  const totalEmployees = users.length;
  const todaysPunches = attendanceHistory.filter(r => {
      const recordDate = new Date(r.timestamp).setHours(0,0,0,0);
      return recordDate === today;
  });
  const presentCount = new Set(todaysPunches.filter(r => r.type === AttendanceType.IN).map(r => r.userId)).size;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const openTickets = tickets.filter(t => t.status === 'Open').length;

  const handleDownloadReport = () => {
      const headers = ['Employee ID', 'Name', 'Role', 'Department', 'Email', 'Status'];
      const rows = users.map(u => [
          u.employeeId,
          u.name,
          u.role,
          u.department,
          u.email,
          'Active'
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Employee_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const handleRunPayroll = async () => {
      setGenerating(true);
      
      const date = new Date();
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth(); 
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const timestamp = Date.now();
      
      const newRecords: PayrollRecord[] = [];
      const newDocs: Document[] = [];

      const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
      
      const isLeave = (d: number, employeeId: string) => {
          return leaves.some(l => l.userId === employeeId && l.status === 'Approved' && l.startDate <= d && l.endDate >= d);
      };
      
      const isHoliday = (d: Date) => {
          return holidays.some(h => {
              const hDate = new Date(h.date);
              return hDate.getDate() === d.getDate() && hDate.getMonth() === d.getMonth();
          });
      };

      const getAttendanceStatus = (d: number, employeeId: string): 'Present' | 'Half Day' | 'Absent' | 'Late' | 'Early Exit' => {
          const targetDate = new Date(d);
          targetDate.setHours(0,0,0,0);
          
          const records = attendanceHistory.filter(r => {
              if (r.userId !== employeeId) return false;
              const recDate = new Date(r.timestamp).setHours(0,0,0,0);
              return recDate === targetDate.getTime(); 
          }).sort((a,b) => a.timestamp - b.timestamp);
          
          // 0. Check Absence
          if (records.length === 0) return 'Absent';

          const punchIn = records.find(r => r.type === AttendanceType.IN);
          const punchOut = records.find(r => r.type === AttendanceType.OUT);
          
          // Get Shift
          const userShift = getShiftForDate(employeeId, d, rosterAssignments, users, shifts) || 
                            { startTime: '09:00', endTime: '18:00', gracePeriod: 15, name: 'General', id: 'GS', nightShift: false };

          const [sH, sM] = userShift.startTime.split(':').map(Number);
          const [eH, eM] = userShift.endTime.split(':').map(Number);
          
          const shiftStart = new Date(targetDate);
          shiftStart.setHours(sH, sM, 0, 0);
          
          let shiftEnd = new Date(targetDate);
          shiftEnd.setHours(eH, eM, 0, 0);
          
          if (userShift.nightShift && shiftEnd < shiftStart) {
              shiftEnd.setDate(shiftEnd.getDate() + 1);
          }

          const shiftDuration = shiftEnd.getTime() - shiftStart.getTime();

          // 1. Half Day (Only 1 punch)
          if (!punchIn || !punchOut) {
             return 'Half Day';
          }

          // 2. Half Day (Duration < 50%)
          const worked = punchOut.timestamp - punchIn.timestamp;
          if (worked < (shiftDuration / 2)) {
              return 'Half Day';
          }

          // 3. Late Check
          const graceLimit = new Date(shiftStart.getTime() + userShift.gracePeriod * 60000);
          if (punchIn.timestamp > graceLimit.getTime()) {
              return 'Late';
          }

          // 4. Early Exit Check
          if (punchOut.timestamp < shiftEnd.getTime()) {
              return 'Early Exit';
          }

          return 'Present';
      };

      const getReimbursements = (employeeId: string) => {
          return expenses
            .filter(e => e.userId === employeeId && e.status === 'Approved' && e.approvedDate)
            .filter(e => {
                const appDate = new Date(e.approvedDate!);
                return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
            })
            .reduce((sum, e) => sum + e.amount, 0);
      };

      for (const u of users) {
          let structure = u.salaryStructure || (u.salary ? generateStructure(u.salary) : generateStructure(600000));
          
          let workedDays = 0;
          let unpaidDays = 0;
          let infractionCount = 0;

          for (let day = 1; day <= daysInMonth; day++) {
              const currentDayDate = new Date(currentYear, currentMonth, day);
              const currentDayTs = currentDayDate.getTime();
              
              if (isWeekend(currentDayDate) || isHoliday(currentDayDate) || isLeave(currentDayTs, u.id)) {
                  workedDays++; 
              } else {
                  const status = getAttendanceStatus(currentDayTs, u.id);
                  if (status === 'Present') {
                      workedDays++;
                  } else if (status === 'Late' || status === 'Early Exit') {
                      workedDays++;
                      infractionCount++;
                  } else if (status === 'Half Day') {
                      workedDays += 0.5;
                      unpaidDays += 0.5;
                  } else {
                      unpaidDays++;
                  }
              }
          }

          const penaltyDays = Math.floor(infractionCount / 3);
          const totalPayableDays = daysInMonth - unpaidDays - penaltyDays;

          const monthlyGross = structure.basic + structure.hra + structure.allowances;
          const perDaySalary = monthlyGross / daysInMonth;
          const lopDeduction = Math.round(perDaySalary * unpaidDays);
          const penaltyDeduction = Math.round(perDaySalary * penaltyDays);
          
          const reimbursements = getReimbursements(u.id);
          
          const totalEarnings = monthlyGross; 
          const statutoryDeductions = structure.pfEmployee + structure.pt + structure.tds + (structure.esiEmployee || 0);
          const totalDeductions = statutoryDeductions + lopDeduction + penaltyDeduction;
          const netPay = Math.round(totalEarnings - totalDeductions + reimbursements);

          const record: PayrollRecord = {
              id: `pay_${u.id}_${timestamp}`,
              employeeId: u.id,
              month: monthName,
              grossPay: totalEarnings,
              deductions: totalDeductions,
              netPay: netPay,
              reimbursements: reimbursements,
              createdDate: timestamp,
              generatedBy: currentUser.id,
              status: 'Paid',
              totalDays: daysInMonth,
              payableDays: totalPayableDays,
              unpaidDays: unpaidDays + penaltyDays,
              lopDeduction: lopDeduction,
              penaltyDeduction: penaltyDeduction
          };
          newRecords.push(record);

          const html = generatePayslipHTML(u, record);
          const blob = new Blob([html], { type: 'text/html' });
          const fileName = `payslips/${u.id}_${monthName.replace(' ', '_')}.html`;
          
          let downloadUrl = '#';
          try {
              downloadUrl = await StorageService.uploadFile(fileName, blob, 'text/html');
          } catch (e) {
              console.warn("Failed to upload payslip, using dummy link", e);
          }

          newDocs.push({
              id: `doc_${u.id}_${timestamp}`,
              title: `Payslip - ${monthName}`,
              type: 'pdf', 
              category: 'payslips',
              date: timestamp,
              size: '0.2 MB',
              url: downloadUrl, 
              ownerId: u.id
          });
      }
      
      onGeneratePayslips(newRecords, newDocs);
      setGenerating(false);
      alert(`Payroll Processed! ${newRecords.length} records generated.`);
  };

  const renderDashboard = () => (
      <div className="space-y-6 animate-fade-in pb-4">
          <div className="grid grid-cols-2 gap-4">
              <button onClick={onNavigateToDirectory} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><UsersIcon className="w-5 h-5" /></div>
                  <div><h3 className="text-2xl font-bold text-slate-800">{totalEmployees}</h3><p className="text-xs text-slate-500 font-medium uppercase">Total Headcount</p></div>
              </button>
              <button onClick={() => setActiveTab('attendance')} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><CheckCircleIcon className="w-5 h-5" /></div>
                  <div><h3 className="text-2xl font-bold text-slate-800">{presentCount}</h3><p className="text-xs text-slate-500 font-medium uppercase">Present Today</p></div>
              </button>
              <button onClick={onNavigateToLeaves} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><UsersIcon className="w-5 h-5" /></div>
                  <div><h3 className="text-2xl font-bold text-slate-800">{pendingLeaves}</h3><p className="text-xs text-slate-500 font-medium uppercase">Leave Requests</p></div>
              </button>
              <button onClick={onNavigateToHelpdesk} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><LifeBuoyIcon className="w-5 h-5" /></div>
                  <div><h3 className="text-2xl font-bold text-slate-800">{openTickets}</h3><p className="text-xs text-slate-500 font-medium uppercase">Open Tickets</p></div>
              </button>
          </div>
          <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
               <h3 className="text-lg font-bold mb-4 relative z-10">Administrative Actions</h3>
               <div className="grid grid-cols-2 gap-3 relative z-10">
                   <button onClick={onNavigateToDirectory} className="flex items-center space-x-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left">
                       <div className="bg-blue-500 p-2 rounded-lg"><PlusIcon className="w-4 h-4 text-white" /></div>
                       <div><span className="block text-sm font-bold">Onboard</span><span className="text-[10px] text-slate-400">Add New Employee</span></div>
                   </button>
                   <button onClick={handleDownloadReport} className="flex items-center space-x-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left">
                       <div className="bg-green-500 p-2 rounded-lg"><ChartBarIcon className="w-4 h-4 text-white" /></div>
                       <div><span className="block text-sm font-bold">Reports</span><span className="text-[10px] text-slate-400">Download CSV</span></div>
                   </button>
               </div>
          </div>
      </div>
  );

  const renderAttendanceMonitor = () => (
        <div className="animate-fade-in space-y-4 pb-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Live Muster Roll</h3>
                <span className="text-xs text-slate-500">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="space-y-2">
                {users.map((user) => {
                    const todaysPunches = attendanceHistory.filter(r => r.userId === user.id && new Date(r.timestamp).setHours(0,0,0,0) === today).sort((a,b) => a.timestamp - b.timestamp);
                    const punchIn = todaysPunches.find(p => p.type === AttendanceType.IN);
                    const punchOut = todaysPunches.find(p => p.type === AttendanceType.OUT);
                    
                    // --- RESOLVE SHIFT (Roster -> Default -> General) ---
                    const currentShift = getShiftForDate(user.id, today, rosterAssignments, users, shifts) || 
                                         { startTime: '09:00', endTime: '18:00', gracePeriod: 15, name: 'General', id: 'GS', nightShift: false };

                    // --- CALCULATE STATUS ---
                    let displayStatus = 'Absent';
                    let statusColor = 'bg-red-100 text-red-700';

                    // Check Leave First
                    const onLeave = leaves.find(l => l.userId === user.id && l.status === 'Approved' && l.startDate <= today && l.endDate >= today);

                    if (onLeave) {
                        displayStatus = 'On Leave';
                        statusColor = 'bg-blue-100 text-blue-700 border border-blue-200';
                    } else if (todaysPunches.length === 0) {
                        displayStatus = 'Absent';
                    } else {
                        // Calc Timings
                        const [sH, sM] = currentShift.startTime.split(':').map(Number);
                        const [eH, eM] = currentShift.endTime.split(':').map(Number);
                        
                        const shiftStart = new Date(today);
                        shiftStart.setHours(sH, sM, 0, 0);
                        
                        let shiftEnd = new Date(today);
                        shiftEnd.setHours(eH, eM, 0, 0);
                        
                        if (currentShift.nightShift && shiftEnd < shiftStart) {
                             shiftEnd.setDate(shiftEnd.getDate() + 1);
                        }

                        // Late Threshold
                        const graceTime = new Date(shiftStart.getTime() + (currentShift.gracePeriod * 60000));
                        const isLate = punchIn && punchIn.timestamp > graceTime.getTime();

                        if (punchIn && !punchOut) {
                            displayStatus = isLate ? 'Late' : 'Working';
                            statusColor = isLate ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
                        } else if (punchIn && punchOut) {
                            // Full Logic:
                            // 1. Check Half Day (Duration < 50%)
                            const duration = punchOut.timestamp - punchIn.timestamp;
                            const totalShiftTime = shiftEnd.getTime() - shiftStart.getTime();
                            const isHalfDay = duration < (totalShiftTime / 2);
                            
                            // 2. Check Early Exit
                            const isEarlyExit = punchOut.timestamp < shiftEnd.getTime();

                            if (isHalfDay) {
                                displayStatus = 'Half Day';
                                statusColor = 'bg-purple-100 text-purple-700';
                            } else if (isLate) {
                                displayStatus = 'Late';
                                statusColor = 'bg-orange-100 text-orange-700';
                            } else if (isEarlyExit) {
                                displayStatus = 'Early Exit';
                                statusColor = 'bg-yellow-100 text-yellow-700';
                            } else {
                                displayStatus = 'Present';
                                statusColor = 'bg-green-100 text-green-700';
                            }
                        }
                    }

                    return (
                        <div key={user.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{user.name}</h4>
                                    <p className="text-[10px] text-slate-500">{user.role}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{currentShift.name} ({currentShift.startTime}-{currentShift.endTime})</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase block mb-1 ${statusColor}`}>{displayStatus}</span>
                                <span className="text-xs text-slate-500 font-mono">
                                    {punchIn ? new Date(punchIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} 
                                    {' - '}
                                    {punchOut ? new Date(punchOut.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
  );

  const renderPayroll = () => {
      const historyByMonth: {[key: string]: PayrollRecord[]} = {};
      payrollHistory.forEach(record => {
          if (!historyByMonth[record.month]) historyByMonth[record.month] = [];
          historyByMonth[record.month].push(record);
      });
      return (
      <div className="space-y-6 animate-fade-in pb-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
               <h3 className="text-lg font-bold mb-2">Automated Payroll</h3>
               <p className="text-sm text-emerald-100 mb-6 max-w-xs leading-relaxed">Payroll is calculated based on daily attendance, approved leaves, and expense reimbursements.</p>
               <button onClick={handleRunPayroll} disabled={generating} className="bg-white text-emerald-600 font-bold px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center space-x-2">
                   {generating ? <span>Processing...</span> : <><CurrencyIcon className="w-5 h-5" /><span>Run Payroll for {new Date().toLocaleString('default', { month: 'long' })}</span></>}
               </button>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Payroll History</h3>
              <div className="space-y-3">
                  {Object.keys(historyByMonth).length === 0 ? <div className="text-center py-4 text-slate-400 text-xs">No payroll runs found.</div> : 
                      Object.entries(historyByMonth).map(([month, records]) => (
                        <div key={month} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center"><CheckCircleIcon className="w-5 h-5" /></div><div><div className="font-bold text-sm text-slate-800">{month}</div><div className="text-xs text-slate-500">Processed on {new Date(records[0].createdDate).toLocaleDateString()}</div></div></div>
                            <span className="text-xs font-bold text-slate-600">{records.length} Staff Paid</span>
                        </div>
                      ))
                  }
              </div>
          </div>
      </div>
      );
  };

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden pb-24">
      <div className="bg-white p-4 border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-2 mb-4">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-slate-900">HRMS Console</h2>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Overview</button>
            <button onClick={() => setActiveTab('attendance')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Muster Roll</button>
            <button onClick={() => setActiveTab('payroll')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Payroll</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'attendance' && renderAttendanceMonitor()}
          {activeTab === 'payroll' && renderPayroll()}
      </div>
    </div>
  );
};

export default HRMSView;
