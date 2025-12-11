
import React, { useState, useRef } from 'react';
import { UserProfile, BankDetails, SalaryStructure, StatutoryDetails, Shift } from '../types';
import { PencilIcon, MapPinIcon, CameraIcon, BankIcon, IdCardIcon, CurrencyIcon, UserIcon, ClockIcon, UsersIcon } from './Icons';
import OrgHierarchy from './OrgHierarchy';

interface EmployeeDetailProps {
  employee: UserProfile;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  shifts?: Shift[]; // Added shifts prop
  onUpdate: (updatedEmployee: UserProfile) => void;
  onBack?: () => void;
}

type TabType = 'profile' | 'financial' | 'salary' | 'docs';

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee, currentUser, allUsers, shifts = [], onUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(employee);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // PERMISSIONS
  // 1. Can enter Edit Mode: HR ONLY (Strict Requirement)
  const canEdit = currentUser.isHR;
  
  // 2. Can Edit Sensitive Data (Financials/Salary): HR ONLY
  const canEditSensitive = isEditing && currentUser.isHR;

  // Initialize nested objects if missing
  if (!formData.bankDetails) formData.bankDetails = { accountNumber: '', ifscCode: '', bankName: '', branchName: '', accountType: 'Savings' };
  if (!formData.statutoryDetails) formData.statutoryDetails = { panNumber: '', aadhaarNumber: '', uanNumber: '', esiNumber: '' };
  if (!formData.salaryStructure) formData.salaryStructure = { annualCTC: 0, basic: 0, hra: 0, allowances: 0, pfEmployee: 0, esiEmployee: 0, pt: 200, tds: 0, pfRate: 12, esiRate: 0.75 };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section: 'bankDetails' | 'statutoryDetails' | 'salaryStructure', field: string, value: string | number) => {
      setFormData(prev => ({
          ...prev,
          [section]: {
              ...prev[section] as any,
              [field]: value
          }
      }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const timestamp = new Date(e.target.value).getTime();
      setFormData(prev => ({ ...prev, joiningDate: timestamp }));
  };

  const handleCTCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const ctc = parseFloat(e.target.value) || 0;
      
      // Auto-calculate structure based on standard Indian payroll norms
      const monthlyGross = Math.round(ctc / 12);
      const basic = Math.round(monthlyGross * 0.40);
      const hra = Math.round(monthlyGross * 0.20);
      const allowances = Math.round(monthlyGross * 0.40); // Balance
      
      const pfRate = formData.salaryStructure?.pfRate || 12;
      const esiRate = formData.salaryStructure?.esiRate || 0.75;

      const pfAmount = Math.round(basic * (pfRate / 100));
      const esiAmount = Math.round(monthlyGross * (esiRate / 100));

      setFormData(prev => ({
          ...prev,
          salary: ctc, // Update root salary for consistency
          salaryStructure: {
              ...prev.salaryStructure!,
              annualCTC: ctc,
              basic,
              hra,
              allowances,
              pfEmployee: pfAmount,
              esiEmployee: esiAmount,
              pt: 200,
              tds: Math.round(monthlyGross * 0.05),
              pfRate,
              esiRate
          }
      }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const imageUrl = URL.createObjectURL(file);
          const updatedUser = { ...employee, avatar: imageUrl };
          onUpdate(updatedUser);
          setFormData(prev => ({ ...prev, avatar: imageUrl }));
      }
  };

  const handleSave = () => { onUpdate(formData); setIsEditing(false); };
  const handleCancel = () => { setFormData(employee); setIsEditing(false); };

  const renderProfileTab = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-xs text-slate-400 font-medium uppercase mb-1">Department</span>
                {isEditing ? <input name="department" value={formData.department} onChange={handleChange} className="w-full p-1 border border-slate-300 rounded text-sm bg-white" /> : <span className="block text-sm font-bold text-slate-800">{employee.department}</span>}
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-xs text-slate-400 font-medium uppercase mb-1">Level</span>
                {isEditing ? (
                    <select name="level" value={formData.level} onChange={handleChange} className="w-full p-1 border border-slate-300 rounded text-sm bg-white">
                        <option value="L1">L1 - Associate</option>
                        <option value="L2">L2 - Senior</option>
                        <option value="M1">M1 - Manager</option>
                        <option value="M2">M2 - Senior Manager</option>
                        <option value="D1">D1 - Director</option>
                        <option value="VP">VP</option>
                    </select>
                ) : <span className="block text-sm font-bold text-slate-800">{employee.level}</span>}
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><MapPinIcon className="w-4 h-4" /></div>
                <div>
                    <span className="block text-xs text-slate-400 font-medium uppercase">Location</span>
                    {isEditing ? <input name="location" value={formData.location} onChange={handleChange} className="w-full p-1 border border-slate-300 rounded text-sm bg-white mt-1" /> : <span className="block text-sm font-bold text-slate-800">{employee.location}</span>}
                </div>
            </div>
        </div>

        <div className="p-4 border border-blue-100 bg-blue-50 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-blue-800 uppercase">Personal Details</h3>
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                    {isEditing ? (
                        <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white" placeholder="+91 98765 43210" />
                    ) : (
                        <span className="block text-sm font-bold text-slate-800">{formData.phone || 'Not provided'}</span>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    {isEditing ? (
                        <input name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white" />
                    ) : (
                        <span className="block text-sm font-bold text-slate-800">{formData.email}</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Joining Date</label>
                    {isEditing ? (
                        <input 
                            type="date" 
                            value={formData.joiningDate ? new Date(formData.joiningDate).toISOString().split('T')[0] : ''} 
                            onChange={handleDateChange} 
                            className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white" 
                        />
                    ) : (
                        <span className="block text-sm font-bold text-slate-800">
                            {formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString() : 'Not Set'}
                        </span>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                    {isEditing ? (
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    ) : (
                        <span className="block text-sm font-bold text-slate-800">{formData.gender}</span>
                    )}
                </div>
            </div>

            {isEditing && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Password</label>
                    <input name="password" type="text" value={formData.password || ''} onChange={handleChange} className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white font-mono" />
                </div>
            )}
        </div>

        {/* WORK SHIFT ASSIGNMENT */}
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div className="w-full">
                <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Assigned Shift</label>
                {isEditing ? (
                    <select 
                        name="shiftId" 
                        value={formData.shiftId || ''} 
                        onChange={handleChange} 
                        className="w-full p-2 border border-purple-200 rounded-lg text-sm bg-white text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Select Shift...</option>
                        {shifts.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.startTime} - {s.endTime})
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-900">
                            {shifts.find(s => s.id === formData.shiftId)?.name || 'General Shift'}
                        </span>
                        <span className="text-xs text-purple-500">
                            ({shifts.find(s => s.id === formData.shiftId)?.startTime || '09:00'} - {shifts.find(s => s.id === formData.shiftId)?.endTime || '18:00'})
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* HIERARCHY EDITING (Only in Edit Mode) */}
        {isEditing && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" /> Reporting Hierarchy
                </h3>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reporting Manager (L1)</label>
                    <select 
                        name="managerId"
                        value={formData.managerId || ''} 
                        onChange={handleChange} 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                        <option value="">No Manager</option>
                        {allUsers.filter(u => u.id !== formData.id && u.status !== 'Deleted').map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.level})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manager's Manager (L2)</label>
                    <select 
                        name="managerL2Id"
                        value={formData.managerL2Id || ''} 
                        onChange={handleChange} 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                        <option value="">No L2 Manager</option>
                        {allUsers.filter(u => u.id !== formData.id && u.id !== formData.managerId && u.status !== 'Deleted').map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.level})</option>
                        ))}
                    </select>
                </div>
            </div>
        )}

        {/* View Hierarchy (Read Only) */}
        {!isEditing && <OrgHierarchy targetUser={employee} allUsers={allUsers} />}
    </div>
  );

  const renderFinancialTab = () => (
      <div className="space-y-6 animate-fade-in">
          {!currentUser.isHR && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs font-medium text-center">
                  Financial details are view-only. Contact HR for corrections.
              </div>
          )}
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <div className="flex items-center space-x-2 mb-4">
                  <BankIcon className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-orange-900">Bank Account</h3>
              </div>
              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bank Name</label>
                          <input disabled={!canEditSensitive} value={formData.bankDetails?.bankName} onChange={(e) => handleNestedChange('bankDetails', 'bankName', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} placeholder="e.g. HDFC" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                          {canEditSensitive ? (
                              <select 
                                value={formData.bankDetails?.accountType} 
                                onChange={(e) => handleNestedChange('bankDetails', 'accountType', e.target.value)} 
                                className="w-full p-2 border border-slate-200 rounded bg-white text-sm"
                              >
                                  <option value="Savings">Savings</option>
                                  <option value="Current">Current</option>
                              </select>
                          ) : (
                              <input disabled value={formData.bankDetails?.accountType} className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-slate-500 text-sm" />
                          )}
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Number</label>
                      <input disabled={!canEditSensitive} value={formData.bankDetails?.accountNumber} onChange={(e) => handleNestedChange('bankDetails', 'accountNumber', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm font-mono ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IFSC Code</label>
                        <input disabled={!canEditSensitive} value={formData.bankDetails?.ifscCode} onChange={(e) => handleNestedChange('bankDetails', 'ifscCode', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm uppercase font-mono ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch</label>
                        <input disabled={!canEditSensitive} value={formData.bankDetails?.branchName} onChange={(e) => handleNestedChange('bankDetails', 'branchName', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} />
                    </div>
                  </div>
              </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-center space-x-2 mb-4">
                  <IdCardIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-purple-900">Statutory Info</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PAN Number</label>
                      <input disabled={!canEditSensitive} value={formData.statutoryDetails?.panNumber} onChange={(e) => handleNestedChange('statutoryDetails', 'panNumber', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm uppercase font-mono ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aadhaar</label>
                      <input disabled={!canEditSensitive} value={formData.statutoryDetails?.aadhaarNumber} onChange={(e) => handleNestedChange('statutoryDetails', 'aadhaarNumber', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm font-mono ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} />
                  </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PF UAN</label>
                      <input disabled={!canEditSensitive} value={formData.statutoryDetails?.uanNumber} onChange={(e) => handleNestedChange('statutoryDetails', 'uanNumber', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm font-mono ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ESI Number</label>
                      <input disabled={!canEditSensitive} value={formData.statutoryDetails?.esiNumber} onChange={(e) => handleNestedChange('statutoryDetails', 'esiNumber', e.target.value)} className={`w-full p-2 border border-slate-200 rounded bg-white text-sm font-mono ${!canEditSensitive && 'text-slate-500 bg-slate-50'}`} />
                  </div>
              </div>
          </div>
      </div>
  );

  const renderSalaryTab = () => (
      <div className="space-y-6 animate-fade-in">
           {canEditSensitive ? (
               <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg">
                   <label className="block text-xs font-bold text-blue-200 uppercase mb-1">Annual CTC (₹)</label>
                   <input 
                    type="number"
                    value={formData.salaryStructure?.annualCTC} 
                    onChange={handleCTCChange} 
                    className="w-full p-2 bg-blue-700 rounded text-xl font-bold text-white border-none outline-none focus:ring-2 focus:ring-white" 
                   />
                   <p className="text-[10px] text-blue-200 mt-2">Updating CTC auto-calculates the breakdown below.</p>
               </div>
           ) : (
                <div className="bg-slate-900 p-4 rounded-xl text-white shadow-lg">
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Annual Package</label>
                   <div className="text-2xl font-bold">₹ {formData.salaryStructure?.annualCTC?.toLocaleString()}</div>
                   <div className="mt-2 text-[10px] bg-white/10 inline-block px-2 py-1 rounded text-slate-300">
                       Salary Structure Locked
                   </div>
               </div>
           )}

           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
               <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                   <h3 className="font-bold text-slate-700 text-sm">Monthly Breakdown</h3>
                   {canEditSensitive && <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">Editable</span>}
               </div>
               <div className="p-4 space-y-3">
                   {/* EARNINGS */}
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Basic Pay</span>
                       {canEditSensitive ? (
                           <input type="number" value={formData.salaryStructure?.basic} onChange={(e) => handleNestedChange('salaryStructure', 'basic', parseFloat(e.target.value))} className="w-24 p-1 border rounded text-right font-bold" />
                       ) : (
                           <span className="font-bold">₹{formData.salaryStructure?.basic?.toLocaleString()}</span>
                       )}
                   </div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">HRA</span>
                       {canEditSensitive ? (
                           <input type="number" value={formData.salaryStructure?.hra} onChange={(e) => handleNestedChange('salaryStructure', 'hra', parseFloat(e.target.value))} className="w-24 p-1 border rounded text-right font-bold" />
                       ) : (
                           <span className="font-bold">₹{formData.salaryStructure?.hra?.toLocaleString()}</span>
                       )}
                   </div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Allowances</span>
                       {canEditSensitive ? (
                           <input type="number" value={formData.salaryStructure?.allowances} onChange={(e) => handleNestedChange('salaryStructure', 'allowances', parseFloat(e.target.value))} className="w-24 p-1 border rounded text-right font-bold" />
                       ) : (
                           <span className="font-bold">₹{formData.salaryStructure?.allowances?.toLocaleString()}</span>
                       )}
                   </div>
               </div>

               {/* DEDUCTIONS */}
               <div className="bg-red-50 p-3 border-t border-red-100">
                   <h3 className="font-bold text-red-700 text-xs uppercase mb-2">Deductions</h3>
                   <div className="space-y-2">
                       <div className="flex justify-between items-center text-xs">
                           <div className="flex items-center space-x-2">
                                <span className="text-red-500">PF (Employee)</span>
                                {canEditSensitive && (
                                    <div className="flex items-center bg-white rounded border border-red-200 px-1">
                                        <input type="number" value={formData.salaryStructure?.pfRate} onChange={(e) => handleNestedChange('salaryStructure', 'pfRate', parseFloat(e.target.value))} className="w-8 text-center text-red-700 font-bold outline-none" />
                                        <span className="text-red-400">%</span>
                                    </div>
                                )}
                           </div>
                           {canEditSensitive ? (
                               <input type="number" value={formData.salaryStructure?.pfEmployee} onChange={(e) => handleNestedChange('salaryStructure', 'pfEmployee', parseFloat(e.target.value))} className="w-20 p-1 border border-red-200 rounded text-right font-bold text-red-700 bg-white" />
                           ) : (
                               <span className="font-bold text-red-700">₹{formData.salaryStructure?.pfEmployee?.toLocaleString()}</span>
                           )}
                       </div>
                       
                       <div className="flex justify-between items-center text-xs">
                           <span className="text-red-500">Professional Tax</span>
                           {canEditSensitive ? (
                               <input type="number" value={formData.salaryStructure?.pt} onChange={(e) => handleNestedChange('salaryStructure', 'pt', parseFloat(e.target.value))} className="w-20 p-1 border border-red-200 rounded text-right font-bold text-red-700 bg-white" />
                           ) : (
                               <span className="font-bold text-red-700">₹{formData.salaryStructure?.pt?.toLocaleString()}</span>
                           )}
                       </div>

                       <div className="flex justify-between items-center text-xs">
                           <div className="flex items-center space-x-2">
                                <span className="text-red-500">ESI</span>
                                {canEditSensitive && (
                                    <div className="flex items-center bg-white rounded border border-red-200 px-1">
                                        <input type="number" value={formData.salaryStructure?.esiRate} onChange={(e) => handleNestedChange('salaryStructure', 'esiRate', parseFloat(e.target.value))} className="w-8 text-center text-red-700 font-bold outline-none" />
                                        <span className="text-red-400">%</span>
                                    </div>
                                )}
                           </div>
                           {canEditSensitive ? (
                               <input type="number" value={formData.salaryStructure?.esiEmployee} onChange={(e) => handleNestedChange('salaryStructure', 'esiEmployee', parseFloat(e.target.value))} className="w-20 p-1 border border-red-200 rounded text-right font-bold text-red-700 bg-white" />
                           ) : (
                               <span className="font-bold text-red-700">₹{formData.salaryStructure?.esiEmployee?.toLocaleString()}</span>
                           )}
                       </div>

                       <div className="flex justify-between items-center text-xs">
                           <span className="text-red-500">TDS (Income Tax)</span>
                           {canEditSensitive ? (
                               <input type="number" value={formData.salaryStructure?.tds} onChange={(e) => handleNestedChange('salaryStructure', 'tds', parseFloat(e.target.value))} className="w-20 p-1 border border-red-200 rounded text-right font-bold text-red-700 bg-white" />
                           ) : (
                               <span className="font-bold text-red-700">₹{formData.salaryStructure?.tds?.toLocaleString()}</span>
                           )}
                       </div>
                   </div>
               </div>
           </div>
      </div>
  );

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden pb-24">
      <div className="flex-1 overflow-y-auto">
        {/* Header Image */}
        <div className="h-32 bg-gradient-to-r from-orange-900 to-slate-900 relative shrink-0">
            {onBack && (
                <button onClick={onBack} className="absolute top-4 left-4 text-white/80 hover:text-white flex items-center space-x-1 z-10 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    <span className="text-sm font-medium">Back</span>
                </button>
            )}
        </div>

        {/* Profile Header */}
        <div className="px-6 relative -mt-12 mb-6">
            <div className="flex justify-between items-end">
                <div className="relative group">
                    <img src={formData.avatar} alt={formData.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                    {canEdit && (
                        <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-slate-900 text-white p-1.5 rounded-full shadow-md border-2 border-white hover:bg-slate-700 transition-colors">
                            <CameraIcon className="w-4 h-4" />
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                {canEdit && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="mb-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center space-x-2 active:scale-95 transition-transform">
                        <PencilIcon className="w-3 h-3" />
                        <span>Edit Profile</span>
                    </button>
                )}
            </div>
            
            <div className="mt-4">
                {isEditing ? (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-semibold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title</label>
                            <input name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
                        <div className="flex items-center space-x-2 text-slate-500 font-medium">
                            <span>{employee.role}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-orange-600 font-mono text-xs bg-orange-50 px-2 py-0.5 rounded">{employee.employeeId}</span>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* TABS */}
        <div className="px-6 mb-6">
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Profile
                </button>
                <button onClick={() => setActiveTab('financial')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'financial' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Financial
                </button>
                <button onClick={() => setActiveTab('salary')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'salary' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Salary
                </button>
            </div>
        </div>

        <div className="px-6 space-y-8 pb-10">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'financial' && renderFinancialTab()}
            {activeTab === 'salary' && renderSalaryTab()}

            {isEditing && (
                <div className="flex space-x-3 pt-6 border-t border-slate-100">
                    <button onClick={handleCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg">Save Changes</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;
