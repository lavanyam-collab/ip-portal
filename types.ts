


export enum AttendanceType {
  IN = 'CLOCK_IN',
  OUT = 'CLOCK_OUT'
}

export interface AttendanceRecord {
  id: string;
  userId: string; 
  type: AttendanceType;
  timestamp: number;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  photoUrl: string;
  remarks?: string;
  status?: 'Regular' | 'Late' | 'Early Exit' | 'Overtime' | 'Half Day' | 'Absent' | 'Regularized';
  shiftId?: string; // Track which shift this punch belonged to
}

export interface AttendanceRegularization {
    id: string;
    userId: string;
    date: number; 
    type: AttendanceType; 
    originalTime?: number;
    newTime: number; 
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    managerId: string;
    appliedOn: number;
}

export interface EmployeeUpdate {
  id: string;
  author: string;
  avatar: string;
  role: string;
  content: string;
  timestamp: number;
  likes: number;
  attachmentUrl?: string; 
  attachmentType?: 'image' | 'video' | 'pdf';
  attachmentName?: string;
}

// --- HRMS MASTER DATA MODELS ---

export interface BankDetails {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    accountType: 'Savings' | 'Current';
}

export interface StatutoryDetails {
    panNumber: string;
    aadhaarNumber: string;
    uanNumber?: string; 
    esiNumber?: string; 
}

export interface SalaryStructure {
    annualCTC: number;
    basic: number;     
    hra: number;       
    allowances: number;
    pfEmployee: number; 
    esiEmployee: number;
    pt: number;        
    tds: number;       
    
    // Config Rates
    pfRate?: number;   
    esiRate?: number;  
}

export interface Shift {
    id: string;
    name: string;
    startTime: string; // Format "HH:MM" e.g. "09:00"
    endTime: string;   // Format "HH:MM" e.g. "18:00"
    gracePeriod: number; // Minutes e.g. 15
    nightShift: boolean;
}

export interface RosterAssignment {
    id: string;
    userId: string;
    shiftId: string;
    date: string; // YYYY-MM-DD
}

export interface UserProfile {
  id: string;
  employeeId: string;
  name: string;
  phone?: string;
  role: string;
  department: string;
  avatar: string;
  level: string;
  managerId: string | null;
  managerL2Id?: string | null; // Added L2 Manager support
  isHR: boolean;
  email: string;
  location: string;
  gender: 'Male' | 'Female' | 'Other';
  password?: string;
  status?: 'Active' | 'Inactive' | 'Deleted'; // Added 'Deleted' status
  
  // New HRMS Fields
  joiningDate?: number;
  salary?: number;
  bankDetails?: BankDetails;
  statutoryDetails?: StatutoryDetails;
  salaryStructure?: SalaryStructure;
  shiftId?: string; // Current Default Shift
}

export type DocumentCategory = 'payslips' | 'identity' | 'education' | 'contracts' | 'policies' | 'uncategorized' | 'pan' | 'aadhaar' | 'certificates' | 'offer_letter' | 'appointment_letter' | 'appraisal_letter' | 'relieving_letter';

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'doc';
  category: DocumentCategory;
  date: number;
  expiryDate?: number; 
  size: string;
  url: string;
  ownerId?: string;
  isDeleted?: boolean; // Soft delete flag
}

export type LeaveType = 'PL' | 'CL' | 'SL' | 'Period' | 'CompOff';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  userId: string; 
  type: LeaveType;
  startDate: number;
  endDate: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: number;
  ccUserIds?: string[];
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  category: 'IT' | 'HR' | 'Admin';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Resolved';
  date: number;
}

export interface ReminderConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface PayrollRecord {
    id: string;
    employeeId: string;
    month: string;      
    grossPay: number;
    deductions: number;
    netPay: number;
    reimbursements?: number; 
    createdDate: number;
    generatedBy: string; 
    status: 'Paid' | 'Pending';
    
    // Attendance & Calculations
    totalDays: number;
    payableDays: number;
    unpaidDays: number;
    lopDeduction: number;
    penaltyDeduction?: number; // For Lates
}

export type ExpenseCategory = 'Travel' | 'Food' | 'Internet' | 'Hotel' | 'Office_Supplies' | 'Other';
export type ExpenseStatus = 'Pending_Manager' | 'Pending_HR' | 'Approved' | 'Rejected';

export interface ExpenseClaim {
    id: string;
    userId: string;
    date: number;
    amount: number;
    category: ExpenseCategory;
    description: string;
    attachmentUrl?: string;
    status: ExpenseStatus;
    appliedOn: number;
    approvedDate?: number; 
}

export interface Holiday {
    id: string;
    name: string;
    date: number;
    recurring: boolean;
}

export interface AppNotification {
    id: string;
    userId: string; // Recipient
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
    read: boolean;
    category?: 'attendance' | 'leave' | 'expense' | 'payroll' | 'system';
    sentViaEmail?: boolean; // Visual indicator for email simulation
}

// --- ASSET MANAGEMENT MODELS ---

export type AssetCategory = 'Laptop' | 'Mobile' | 'SIM' | 'ID_Card' | 'Accessory' | 'Other';
export type AssetStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Retired';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged';

export interface AssetHistoryEvent {
    id: string;
    date: number;
    type: 'Purchase' | 'Assignment' | 'Return' | 'Maintenance' | 'Report';
    description: string;
    actorId: string; // Who performed the action
}

export interface Asset {
    id: string;
    assetId: string; // Physical Tag ID e.g., IP-L-001
    name: string; // e.g., MacBook Pro M1
    category: AssetCategory;
    status: AssetStatus;
    condition: AssetCondition;
    purchaseDate: number;
    assignedTo?: string; // userId
    assignedDate?: number;
    history: AssetHistoryEvent[];
    specifications?: string; // RAM, Storage, etc.
}

export type Tab = 'home' | 'punch' | 'leaves' | 'directory' | 'apps' | 'documents' | 'helpdesk' | 'profile' | 'reminders' | 'payroll' | 'hrms' | 'manager_team' | 'admin_console' | 'expenses' | 'attendance_calendar' | 'activity_history' | 'company_buzz' | 'notifications' | 'assets' | 'recycle_bin';