


import { UserProfile, AttendanceRecord, Document, LeaveRequest, Ticket, EmployeeUpdate, ReminderConfig, PayrollRecord, AttendanceType, AttendanceRegularization, ExpenseClaim, Holiday, Shift, RosterAssignment, SalaryStructure, AppNotification, Asset } from '../types';
import { db, storage } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface DataProvider {
  getUsers: () => Promise<UserProfile[]>;
  saveUsers: (users: UserProfile[]) => Promise<void>;
  getAttendance: () => Promise<AttendanceRecord[]>;
  saveAttendance: (records: AttendanceRecord[]) => Promise<void>;
  getDocuments: () => Promise<Document[]>;
  saveDocuments: (docs: Document[]) => Promise<void>;
  getLeaves: () => Promise<LeaveRequest[]>;
  saveLeaves: (leaves: LeaveRequest[]) => Promise<void>;
  getTickets: () => Promise<Ticket[]>;
  saveTickets: (tickets: Ticket[]) => Promise<void>;
  getUpdates: () => Promise<EmployeeUpdate[]>;
  saveUpdates: (updates: EmployeeUpdate[]) => Promise<void>;
  getReminderConfig: () => Promise<ReminderConfig>;
  saveReminderConfig: (config: ReminderConfig) => Promise<void>;
  getPayrollHistory: () => Promise<PayrollRecord[]>;
  savePayrollHistory: (records: PayrollRecord[]) => Promise<void>;
  getRegularizations: () => Promise<AttendanceRegularization[]>;
  saveRegularizations: (records: AttendanceRegularization[]) => Promise<void>;
  getExpenses: () => Promise<ExpenseClaim[]>;
  saveExpenses: (claims: ExpenseClaim[]) => Promise<void>;
  getHolidays: () => Promise<Holiday[]>;
  saveHolidays: (holidays: Holiday[]) => Promise<void>;
  getShifts: () => Promise<Shift[]>;
  saveShifts: (shifts: Shift[]) => Promise<void>;
  getRosterAssignments: () => Promise<RosterAssignment[]>;
  saveRosterAssignments: (assignments: RosterAssignment[]) => Promise<void>;
  getNotifications: () => Promise<AppNotification[]>;
  saveNotifications: (notifications: AppNotification[]) => Promise<void>;
  getAssets: () => Promise<Asset[]>;
  saveAssets: (assets: Asset[]) => Promise<void>;
  getCredentials: () => Promise<{email?: string | null, password?: string | null}>;
  saveCredentials: (email?: string, password?: string) => Promise<void>;
  uploadFile: (path: string, file: Blob | File, contentType?: string) => Promise<string>;
}

const KEYS = {
  USERS: 'ip_users',
  ATTENDANCE: 'ip_attendance',
  DOCUMENTS: 'ip_documents',
  LEAVES: 'ip_leaves',
  TICKETS: 'ip_tickets',
  UPDATES: 'ip_updates',
  REMINDERS: 'ip_reminders',
  PAYROLL: 'ip_payroll',
  REGULARIZATIONS: 'ip_regularizations',
  EXPENSES: 'ip_expenses',
  HOLIDAYS: 'ip_holidays',
  SHIFTS: 'ip_shifts',
  ROSTER: 'ip_roster',
  NOTIFICATIONS: 'ip_notifications',
  ASSETS: 'ip_assets',
  CREDENTIALS_EMAIL: 'ip_cred_email',
  CREDENTIALS_PASS: 'ip_cred_pass',
};

const simulateRequest = <T>(data: T, ms = 300): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
};

export const generateStructure = (ctc: number): SalaryStructure => {
  const monthlyGross = Math.round(ctc / 12);
  const basic = Math.round(monthlyGross * 0.40);
  const hra = Math.round(monthlyGross * 0.20);
  const allowances = Math.round(monthlyGross * 0.40);
  const pfEmployee = Math.round(basic * 0.12);
  const esiEmployee = monthlyGross < 21000 ? Math.round(monthlyGross * 0.0075) : 0;
  const pt = 200;
  const tds = Math.round(monthlyGross * 0.05); // Simplified 5% TDS

  return {
      annualCTC: ctc,
      basic,
      hra,
      allowances,
      pfEmployee,
      esiEmployee,
      pt,
      tds
  };
};

export const getShiftForDate = (userId: string, dateTs: number, roster: RosterAssignment[], users: UserProfile[], shifts: Shift[]): Shift | undefined => {
    const dateStr = new Date(dateTs).toISOString().split('T')[0];
    // 1. Check Specific Roster Assignment
    const assignment = roster.find(r => r.userId === userId && r.date === dateStr);
    if (assignment) {
        return shifts.find(s => s.id === assignment.shiftId);
    }
    // 2. Check User Default
    const user = users.find(u => u.id === userId);
    if (user && user.shiftId) {
        return shifts.find(s => s.id === user.shiftId);
    }
    // 3. Fallback to General Shift (assuming GS exists or handled by caller)
    return shifts.find(s => s.id === 'GS');
};

export const generatePayslipHTML = (user: UserProfile, record: PayrollRecord) => {
    return `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .logo h1 { margin: 0; color: #111; font-size: 24px; letter-spacing: -1px; }
          .company-info { text-align: right; font-size: 12px; color: #666; }
          .payslip-title { text-align: center; margin-bottom: 30px; }
          .payslip-title h2 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; color: #555; }
          .payslip-title p { margin: 5px 0 0; font-size: 14px; color: #888; }
          .employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .info-group label { display: block; font-size: 10px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 4px; }
          .info-group div { font-size: 14px; font-weight: 500; }
          .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .salary-table th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #555; border-bottom: 1px solid #ddd; }
          .salary-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .amount { text-align: right; font-family: 'Courier New', monospace; }
          .totals { background: #f8fafc; font-weight: bold; }
          .net-pay { background: #0f172a; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
          .net-pay-label { font-size: 14px; text-transform: uppercase; opacity: 0.8; }
          .net-pay-amount { font-size: 32px; font-weight: bold; }
          .footer { text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo"><h1>INTERIOR PLUS</h1></div>
          <div class="company-info">
            123 Design Avenue, Creative District<br>
            Mumbai, Maharashtra 400001<br>
            Tax ID: IP-MUM-2025-X88
          </div>
        </div>
        
        <div class="payslip-title">
          <h2>Payslip</h2>
          <p>For the month of ${record.month}</p>
        </div>

        <div class="employee-info">
          <div class="info-group"><label>Employee Name</label><div>${user.name}</div></div>
          <div class="info-group"><label>Employee ID</label><div>${user.employeeId}</div></div>
          <div class="info-group"><label>Designation</label><div>${user.role}</div></div>
          <div class="info-group"><label>Department</label><div>${user.department}</div></div>
          <div class="info-group"><label>Bank Account</label><div>${user.bankDetails?.accountNumber ? 'XXXX' + user.bankDetails.accountNumber.slice(-4) : 'N/A'}</div></div>
          <div class="info-group"><label>Days Payable</label><div>${record.payableDays} / ${record.totalDays}</div></div>
        </div>

        <table class="salary-table">
          <thead>
            <tr>
              <th>Earnings</th>
              <th class="amount">Amount (INR)</th>
              <th>Deductions</th>
              <th class="amount">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
             <tr>
               <td>Basic Salary</td>
               <td class="amount">${user.salaryStructure?.basic.toLocaleString()}</td>
               <td>Provident Fund</td>
               <td class="amount">${user.salaryStructure?.pfEmployee.toLocaleString()}</td>
             </tr>
             <tr>
               <td>HRA</td>
               <td class="amount">${user.salaryStructure?.hra.toLocaleString()}</td>
               <td>Professional Tax</td>
               <td class="amount">${user.salaryStructure?.pt.toLocaleString()}</td>
             </tr>
             <tr>
               <td>Allowances</td>
               <td class="amount">${user.salaryStructure?.allowances.toLocaleString()}</td>
               <td>Income Tax (TDS)</td>
               <td class="amount">${user.salaryStructure?.tds.toLocaleString()}</td>
             </tr>
             <tr>
               <td>Reimbursements</td>
               <td class="amount">${(record.reimbursements || 0).toLocaleString()}</td>
               <td>Loss of Pay</td>
               <td class="amount">${(record.lopDeduction || 0).toLocaleString()}</td>
             </tr>
             <tr class="totals">
               <td>Gross Earnings</td>
               <td class="amount">${record.grossPay.toLocaleString()}</td>
               <td>Total Deductions</td>
               <td class="amount">${record.deductions.toLocaleString()}</td>
             </tr>
          </tbody>
        </table>

        <div class="net-pay">
           <span class="net-pay-label">Net Payable Amount</span>
           <span class="net-pay-amount">₹${record.netPay.toLocaleString()}</span>
        </div>

        <div class="footer">
          This is a system generated payslip and does not require a signature.<br>
          Generated on ${new Date(record.createdDate).toLocaleDateString()} by Interior Plus HRMS.
        </div>
      </body>
    </html>
    `;
};

// MOCK DATA CONSTANTS

const INITIAL_USERS: UserProfile[] = [
    { id: 'u1', employeeId: 'IP-1001', name: 'Sarah Jenkins', role: 'HR Director', department: 'Human Resources', level: 'D1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'admin@interiorplus.com', phone: '+91 98765 00001', location: 'Mumbai HQ', managerId: null, isHR: true, gender: 'Female', joiningDate: 1672531200000, password: 'admin123', salary: 2400000, status: 'Active' },
    { id: 'u2', employeeId: 'IP-1002', name: 'Mike Ross', role: 'Senior Architect', department: 'Design', level: 'M1', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', email: 'mike@interiorplus.com', phone: '+91 98765 00002', location: 'Bangalore', managerId: 'u1', isHR: false, gender: 'Male', joiningDate: 1675209600000, password: 'user123', salary: 1800000, status: 'Active' },
    { id: 'u3', employeeId: 'IP-1003', name: 'Alex Chen', role: 'Interior Designer', department: 'Design', level: 'L2', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', email: 'employee@interiorplus.com', phone: '+91 98765 00003', location: 'Mumbai HQ', managerId: 'u2', isHR: false, gender: 'Male', joiningDate: 1680307200000, password: 'user123', salary: 900000, status: 'Active' },
    { id: 'u4', employeeId: 'IP-1004', name: 'Emily Blunt', role: 'Junior Designer', department: 'Design', level: 'L1', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', email: 'emily@interiorplus.com', phone: '+91 98765 00004', location: 'Pune', managerId: 'u2', isHR: false, gender: 'Female', joiningDate: 1685577600000, password: 'user123', salary: 600000, status: 'Active' }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
    // Yesterday
    { id: 'a1', userId: 'u3', type: AttendanceType.IN, timestamp: Date.now() - 86400000 - 32400000, location: { lat: 19.076, lng: 72.877, address: 'Mumbai HQ' }, photoUrl: 'https://via.placeholder.com/150', status: 'Regular' },
    { id: 'a2', userId: 'u3', type: AttendanceType.OUT, timestamp: Date.now() - 86400000 - 3600000, location: { lat: 19.076, lng: 72.877, address: 'Mumbai HQ' }, photoUrl: 'https://via.placeholder.com/150', status: 'Regular' },
    // Today (Morning)
    { id: 'a3', userId: 'u2', type: AttendanceType.IN, timestamp: Date.now() - 14400000, location: { lat: 12.971, lng: 77.594, address: 'Bangalore Site' }, photoUrl: 'https://via.placeholder.com/150', status: 'Regular' },
];

const MOCK_DOCUMENTS: Document[] = [
    { id: 'd1', title: 'Employee Handbook 2025', type: 'pdf', category: 'policies', date: Date.now() - 50000000, size: '2.4 MB', url: '#' },
    { id: 'd2', title: 'Holiday List 2025', type: 'pdf', category: 'policies', date: Date.now() - 10000000, size: '0.5 MB', url: '#' },
    // Personal Docs for u3 (Alex)
    { id: 'd3', title: 'PAN Card', type: 'image', category: 'pan', date: Date.now() - 200000000, size: '1.2 MB', url: '#', ownerId: 'u3' },
    { id: 'd4', title: 'Aadhaar Card', type: 'image', category: 'aadhaar', date: Date.now() - 200000000, size: '1.5 MB', url: '#', ownerId: 'u3' },
    { id: 'd5', title: 'Appointment Letter', type: 'pdf', category: 'appointment_letter', date: Date.now() - 31536000000, size: '0.8 MB', url: '#', ownerId: 'u3' },
    { id: 'd6', title: 'Master Degree', type: 'pdf', category: 'education', date: Date.now() - 100000000, size: '3.0 MB', url: '#', ownerId: 'u3' },
    // Expiring Doc Example
    { id: 'd7', title: 'Passport', type: 'pdf', category: 'identity', date: Date.now() - 50000000, expiryDate: Date.now() + 864000000, size: '1.8 MB', url: '#', ownerId: 'u3' }, // Expiring soon-ish
    { id: 'd8', title: 'Driving License', type: 'image', category: 'identity', date: Date.now() - 600000000, expiryDate: Date.now() - 100000, size: '1.1 MB', url: '#', ownerId: 'u3' } // Expired
];

const MOCK_UPDATES: EmployeeUpdate[] = [
    { id: 'up1', author: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'HR Director', content: 'Excited to announce our annual retreat details! Check your emails for the itinerary. 🌴', timestamp: Date.now() - 3600000, likes: 24, attachmentUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800', attachmentType: 'image' },
    { id: 'up2', author: 'Mike Ross', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'Senior Architect', content: 'Great job team on the Oberoi project delivery! The client is thrilled.', timestamp: Date.now() - 86400000, likes: 18 }
];

const MOCK_LEAVES: LeaveRequest[] = [
    { id: 'l1', userId: 'u3', type: 'CL', startDate: Date.now() + 86400000, endDate: Date.now() + 172800000, reason: 'Family function', status: 'Pending', appliedOn: Date.now() - 3600000 }
];

const MOCK_TICKETS: Ticket[] = [
    { id: 't1', userId: 'u3', subject: 'Laptop battery issue', category: 'IT', priority: 'Medium', status: 'Open', date: Date.now() - 7200000 }
];

const MOCK_EXPENSES: ExpenseClaim[] = [
    { id: 'e1', userId: 'u3', amount: 1250, category: 'Food', description: 'Team lunch with client', date: Date.now() - 86400000, status: 'Pending_Manager', appliedOn: Date.now() }
];

const MOCK_HOLIDAYS: Holiday[] = [
    { id: 'h1', name: 'New Year', date: new Date('2025-01-01').getTime(), recurring: true },
    { id: 'h2', name: 'Republic Day', date: new Date('2025-01-26').getTime(), recurring: true },
    { id: 'h3', name: 'Holi', date: new Date('2025-03-14').getTime(), recurring: true },
    { id: 'h4', name: 'Independence Day', date: new Date('2025-08-15').getTime(), recurring: true },
    { id: 'h5', name: 'Diwali', date: new Date('2025-10-20').getTime(), recurring: true },
    { id: 'h6', name: 'Christmas', date: new Date('2025-12-25').getTime(), recurring: true },
];

const MOCK_SHIFTS: Shift[] = [
    { id: 'GS', name: 'General Shift', startTime: '09:00', endTime: '18:00', gracePeriod: 15, nightShift: false },
    { id: 'MS', name: 'Morning Shift', startTime: '06:00', endTime: '15:00', gracePeriod: 15, nightShift: false },
    { id: 'AS', name: 'Afternoon Shift', startTime: '14:00', endTime: '23:00', gracePeriod: 15, nightShift: false },
    { id: 'NS', name: 'Night Shift', startTime: '22:00', endTime: '07:00', gracePeriod: 15, nightShift: true }
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
    { id: 'n1', userId: 'u3', title: 'Welcome to Interior Plus', message: 'Browse your new employee portal.', type: 'info', timestamp: Date.now() - 10000000, read: true, category: 'system' },
    { id: 'n2', userId: 'u3', title: 'Action Required', message: 'Please update your emergency contact details.', type: 'warning', timestamp: Date.now() - 500000, read: false, category: 'system' },
];

const MOCK_ASSETS: Asset[] = [
    {
        id: 'ast_1',
        assetId: 'IP-L-101',
        name: 'MacBook Pro M1',
        category: 'Laptop',
        status: 'Assigned',
        condition: 'Good',
        purchaseDate: Date.now() - 31536000000,
        assignedTo: 'u2', // Mike Ross
        assignedDate: Date.now() - 15000000000,
        history: [],
        specifications: '16GB RAM, 512GB SSD'
    },
    {
        id: 'ast_2',
        assetId: 'IP-M-205',
        name: 'iPhone 13',
        category: 'Mobile',
        status: 'Available',
        condition: 'New',
        purchaseDate: Date.now() - 5000000000,
        history: [],
        specifications: '128GB, Midnight'
    },
    {
        id: 'ast_3',
        assetId: 'IP-S-303',
        name: 'Jio 5G SIM',
        category: 'SIM',
        status: 'Assigned',
        condition: 'New',
        purchaseDate: Date.now() - 2000000000,
        assignedTo: 'u2',
        assignedDate: Date.now() - 2000000000,
        history: [],
        specifications: '+91 98765 00002'
    }
];

const INITIAL_REMINDER_CONFIG: ReminderConfig = {
    enabled: true, startTime: '09:00', endTime: '18:00'
};


// PROVIDER IMPLEMENTATIONS

const LocalProvider: DataProvider = {
    getUsers: async () => {
        try {
            const stored = localStorage.getItem(KEYS.USERS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveUsers(INITIAL_USERS);
            return INITIAL_USERS;
        } catch (e) { return []; }
    },
    saveUsers: async (users) => {
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        await simulateRequest(null, 50);
    },

    getAttendance: async () => {
        try {
            const stored = localStorage.getItem(KEYS.ATTENDANCE);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveAttendance(INITIAL_ATTENDANCE);
            return INITIAL_ATTENDANCE;
        } catch(e) { return []; }
    },
    saveAttendance: async (records) => {
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
        await simulateRequest(null, 50);
    },
    
    getDocuments: async () => {
        try {
            const stored = localStorage.getItem(KEYS.DOCUMENTS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveDocuments(MOCK_DOCUMENTS);
            return MOCK_DOCUMENTS;
        } catch(e) { return []; }
    },
    saveDocuments: async (docs) => {
        localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
        await simulateRequest(null, 50);
    },

    getLeaves: async () => {
        try {
            const stored = localStorage.getItem(KEYS.LEAVES);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveLeaves(MOCK_LEAVES);
            return MOCK_LEAVES;
        } catch(e) { return []; }
    },
    saveLeaves: async (leaves) => {
        localStorage.setItem(KEYS.LEAVES, JSON.stringify(leaves));
        await simulateRequest(null, 50);
    },

    getTickets: async () => {
        try {
            const stored = localStorage.getItem(KEYS.TICKETS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveTickets(MOCK_TICKETS);
            return MOCK_TICKETS;
        } catch(e) { return []; }
    },
    saveTickets: async (tickets) => {
        localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
        await simulateRequest(null, 50);
    },

    getUpdates: async () => {
        try {
            const stored = localStorage.getItem(KEYS.UPDATES);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveUpdates(MOCK_UPDATES);
            return MOCK_UPDATES;
        } catch(e) { return []; }
    },
    saveUpdates: async (updates) => {
        localStorage.setItem(KEYS.UPDATES, JSON.stringify(updates));
        await simulateRequest(null, 50);
    },

    getReminderConfig: async () => {
        try {
            const stored = localStorage.getItem(KEYS.REMINDERS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            return INITIAL_REMINDER_CONFIG;
        } catch(e) { return INITIAL_REMINDER_CONFIG; }
    },
    saveReminderConfig: async (config) => {
        localStorage.setItem(KEYS.REMINDERS, JSON.stringify(config));
        await simulateRequest(null, 50);
    },

    getPayrollHistory: async () => {
        const stored = localStorage.getItem(KEYS.PAYROLL);
        return stored ? await simulateRequest(JSON.parse(stored)) : [];
    },
    savePayrollHistory: async (records) => {
        localStorage.setItem(KEYS.PAYROLL, JSON.stringify(records));
        await simulateRequest(null, 50);
    },

    getRegularizations: async () => {
        const stored = localStorage.getItem(KEYS.REGULARIZATIONS);
        return stored ? await simulateRequest(JSON.parse(stored)) : [];
    },
    saveRegularizations: async (records) => {
        localStorage.setItem(KEYS.REGULARIZATIONS, JSON.stringify(records));
        await simulateRequest(null, 50);
    },

    getExpenses: async () => {
        try {
            const stored = localStorage.getItem(KEYS.EXPENSES);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveExpenses(MOCK_EXPENSES);
            return MOCK_EXPENSES;
        } catch(e) { return []; }
    },
    saveExpenses: async (claims) => {
        localStorage.setItem(KEYS.EXPENSES, JSON.stringify(claims));
        await simulateRequest(null, 50);
    },

    getHolidays: async () => {
        try {
            const stored = localStorage.getItem(KEYS.HOLIDAYS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveHolidays(MOCK_HOLIDAYS);
            return MOCK_HOLIDAYS;
        } catch(e) { return []; }
    },
    saveHolidays: async (holidays) => {
        localStorage.setItem(KEYS.HOLIDAYS, JSON.stringify(holidays));
        await simulateRequest(null, 50);
    },

    getShifts: async () => {
        try {
            const stored = localStorage.getItem(KEYS.SHIFTS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveShifts(MOCK_SHIFTS);
            return MOCK_SHIFTS;
        } catch(e) { return []; }
    },
    saveShifts: async (shifts) => {
        localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
        await simulateRequest(null, 50);
    },

    getRosterAssignments: async () => {
        try {
            const stored = localStorage.getItem(KEYS.ROSTER);
            if (stored) return await simulateRequest(JSON.parse(stored));
            return [];
        } catch(e) { return []; }
    },
    saveRosterAssignments: async (assignments) => {
        localStorage.setItem(KEYS.ROSTER, JSON.stringify(assignments));
        await simulateRequest(null, 50);
    },

    getNotifications: async () => {
        try {
            const stored = localStorage.getItem(KEYS.NOTIFICATIONS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveNotifications(MOCK_NOTIFICATIONS);
            return MOCK_NOTIFICATIONS;
        } catch(e) { return []; }
    },
    saveNotifications: async (notifications) => {
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        await simulateRequest(null, 50);
    },

    getAssets: async () => {
        try {
            const stored = localStorage.getItem(KEYS.ASSETS);
            if (stored) return await simulateRequest(JSON.parse(stored));
            await LocalProvider.saveAssets(MOCK_ASSETS);
            return MOCK_ASSETS;
        } catch (e) { return []; }
    },
    saveAssets: async (assets) => {
        localStorage.setItem(KEYS.ASSETS, JSON.stringify(assets));
        await simulateRequest(null, 50);
    },

    getCredentials: async () => {
        return await simulateRequest({
            email: localStorage.getItem(KEYS.CREDENTIALS_EMAIL),
            password: localStorage.getItem(KEYS.CREDENTIALS_PASS)
        });
    },
    saveCredentials: async (email, password) => {
        if (password && email) {
            localStorage.setItem(KEYS.CREDENTIALS_EMAIL, email);
            localStorage.setItem(KEYS.CREDENTIALS_PASS, password);
        } else {
            localStorage.removeItem(KEYS.CREDENTIALS_EMAIL);
            localStorage.removeItem(KEYS.CREDENTIALS_PASS);
        }
        await simulateRequest(null, 50);
    },

    uploadFile: async (path, file, contentType) => {
        if (!storage) return "#";
        const storageRef = ref(storage, path);
        const metadata = contentType ? { contentType } : undefined;
        await uploadBytes(storageRef, file, metadata);
        return await getDownloadURL(storageRef);
    }
};

const CloudProvider: DataProvider = {
    // --- USERS ---
    getUsers: async () => {
        if (!db) return LocalProvider.getUsers();
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            if (snapshot.empty) return LocalProvider.getUsers(); // Fallback initial load
            return snapshot.docs.map(doc => doc.data() as UserProfile);
        } catch (e) { return LocalProvider.getUsers(); }
    },
    saveUsers: async (users) => {
        await LocalProvider.saveUsers(users); // Cache locally
        if (!db) return;
        const batch = writeBatch(db);
        users.forEach(u => {
            const ref = doc(db, 'users', u.id);
            batch.set(ref, u, { merge: true });
        });
        await batch.commit();
    },

    // --- ATTENDANCE (Real Backend Upload) ---
    getAttendance: async () => {
        if (!db) return LocalProvider.getAttendance();
        try {
            const snapshot = await getDocs(collection(db, 'attendance'));
            if (snapshot.empty) return LocalProvider.getAttendance();
            return snapshot.docs.map(doc => doc.data() as AttendanceRecord);
        } catch(e) { return LocalProvider.getAttendance(); }
    },
    saveAttendance: async (records) => {
        await LocalProvider.saveAttendance(records);
        if (!db) return;
        const batch = writeBatch(db);
        records.forEach(r => {
            const ref = doc(db, 'attendance', r.id);
            batch.set(ref, r, { merge: true });
        });
        await batch.commit();
    },

    // --- LEAVES (Real Backend Upload) ---
    getLeaves: async () => {
        if (!db) return LocalProvider.getLeaves();
        try {
            const snapshot = await getDocs(collection(db, 'leaves'));
            return snapshot.docs.map(doc => doc.data() as LeaveRequest);
        } catch(e) { return LocalProvider.getLeaves(); }
    },
    saveLeaves: async (leaves) => {
        await LocalProvider.saveLeaves(leaves);
        if (!db) return;
        const batch = writeBatch(db);
        leaves.forEach(l => {
            const ref = doc(db, 'leaves', l.id);
            batch.set(ref, l, { merge: true });
        });
        await batch.commit();
    },

    // --- EXPENSES (Real Backend Upload) ---
    getExpenses: async () => {
        if (!db) return LocalProvider.getExpenses();
        try {
            const snapshot = await getDocs(collection(db, 'expenses'));
            return snapshot.docs.map(doc => doc.data() as ExpenseClaim);
        } catch(e) { return LocalProvider.getExpenses(); }
    },
    saveExpenses: async (claims) => {
        await LocalProvider.saveExpenses(claims);
        if (!db) return;
        const batch = writeBatch(db);
        claims.forEach(c => {
            const ref = doc(db, 'expenses', c.id);
            batch.set(ref, c, { merge: true });
        });
        await batch.commit();
    },

    // --- TICKETS (Real Backend Upload) ---
    getTickets: async () => {
        if (!db) return LocalProvider.getTickets();
        try {
            const snapshot = await getDocs(collection(db, 'tickets'));
            return snapshot.docs.map(doc => doc.data() as Ticket);
        } catch(e) { return LocalProvider.getTickets(); }
    },
    saveTickets: async (tickets) => {
        await LocalProvider.saveTickets(tickets);
        if (!db) return;
        const batch = writeBatch(db);
        tickets.forEach(t => {
            const ref = doc(db, 'tickets', t.id);
            batch.set(ref, t, { merge: true });
        });
        await batch.commit();
    },

    // --- NOTIFICATIONS (Real Backend Upload) ---
    getNotifications: async () => {
        if (!db) return LocalProvider.getNotifications();
        try {
            const snapshot = await getDocs(collection(db, 'notifications'));
            return snapshot.docs.map(doc => doc.data() as AppNotification);
        } catch(e) { return LocalProvider.getNotifications(); }
    },
    saveNotifications: async (notifications) => {
        await LocalProvider.saveNotifications(notifications); // Cache
        if (!db) return;
        const batch = writeBatch(db);
        notifications.forEach(n => {
            const ref = doc(db, 'notifications', n.id);
            batch.set(ref, n, { merge: true });
        });
        await batch.commit();
    },

    // Fallbacks for other less critical collections (can be expanded similarly)
    getDocuments: async () => LocalProvider.getDocuments(),
    saveDocuments: async (docs) => LocalProvider.saveDocuments(docs),
    getUpdates: async () => LocalProvider.getUpdates(),
    saveUpdates: async (updates) => LocalProvider.saveUpdates(updates),
    getReminderConfig: async () => LocalProvider.getReminderConfig(),
    saveReminderConfig: async (config) => LocalProvider.saveReminderConfig(config),
    getPayrollHistory: async () => LocalProvider.getPayrollHistory(),
    savePayrollHistory: async (records) => LocalProvider.savePayrollHistory(records),
    getRegularizations: async () => LocalProvider.getRegularizations(),
    saveRegularizations: async (records) => LocalProvider.saveRegularizations(records),
    getHolidays: async () => LocalProvider.getHolidays(),
    saveHolidays: async (holidays) => LocalProvider.saveHolidays(holidays),
    getShifts: async () => LocalProvider.getShifts(),
    saveShifts: async (shifts) => LocalProvider.saveShifts(shifts),
    getRosterAssignments: async () => LocalProvider.getRosterAssignments(),
    saveRosterAssignments: async (assignments) => LocalProvider.saveRosterAssignments(assignments),
    getAssets: async () => LocalProvider.getAssets(),
    saveAssets: async (assets) => LocalProvider.saveAssets(assets),

    getCredentials: async () => LocalProvider.getCredentials(),
    saveCredentials: async (email, password) => LocalProvider.saveCredentials(email, password),
    uploadFile: async (path, file, contentType) => LocalProvider.uploadFile(path, file, contentType)
};

const USE_CLOUD = !!db;
export const StorageService: DataProvider = USE_CLOUD ? CloudProvider : LocalProvider;
