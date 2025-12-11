
import React from 'react';
import { Document, UserProfile, PayrollRecord } from '../types';
import { ChevronLeftIcon, DownloadIcon, FileTextIcon } from './Icons';
import { generateStructure, generatePayslipHTML } from '../services/storage';

interface PayrollViewProps {
  user: UserProfile;
  documents: Document[];
  payrollHistory?: PayrollRecord[];
  onBack: () => void;
}

const PayrollView: React.FC<PayrollViewProps> = ({ user, documents, payrollHistory = [], onBack }) => {
  const getSalaryData = () => {
    let structure = user.salaryStructure || (user.salary ? generateStructure(user.salary) : generateStructure(600000));
    const totalEarnings = structure.basic + structure.hra + structure.allowances;
    const totalDeductions = structure.pfEmployee + structure.pt + structure.tds + (structure.esiEmployee || 0);
    const netPay = totalEarnings - totalDeductions;
    
    return {
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      earnings: [
        { label: 'Basic Salary', amount: structure.basic },
        { label: 'HRA', amount: structure.hra },
        { label: 'Allowances', amount: structure.allowances },
      ],
      deductions: [
        { label: 'Provident Fund', amount: structure.pfEmployee },
        { label: 'Professional Tax', amount: structure.pt },
        { label: 'Income Tax (TDS)', amount: structure.tds },
        ...(structure.esiEmployee ? [{ label: 'ESI', amount: structure.esiEmployee }] : [])
      ],
      netPay: netPay,
      ctc: structure.annualCTC
    };
  };

  const currentMonthData = getSalaryData();
  const currentTotalEarnings = currentMonthData.earnings.reduce((a, b) => a + b.amount, 0);
  const currentTotalDeductions = currentMonthData.deductions.reduce((a, b) => a + b.amount, 0);

  const myPayslipsDocs = documents.filter(d => d.category === 'payslips' && d.ownerId === user.id);
  const myPayrollRecords = payrollHistory.filter(r => r.employeeId === user.id);

  const handleDownload = (record?: PayrollRecord, docTitle: string = "Payslip_Current") => {
      // 1. Check if we have a real Cloud URL for this record
      if (record) {
          const matchingDoc = myPayslipsDocs.find(d => d.title.includes(record.month));
          if (matchingDoc && matchingDoc.url && matchingDoc.url.startsWith('http')) {
              window.open(matchingDoc.url, '_blank');
              return;
          }
      }

      // 2. Legacy Fallback
      alert("Downloading Payslip...");
      
      let mockRecord = record;
      if (!mockRecord) {
          mockRecord = {
              id: 'curr', employeeId: user.id, month: currentMonthData.month,
              grossPay: currentTotalEarnings, deductions: currentTotalDeductions, netPay: currentMonthData.netPay,
              createdDate: Date.now(), generatedBy: 'system', status: 'Paid',
              totalDays: 30, payableDays: 30, unpaidDays: 0, lopDeduction: 0
          };
      }

      const htmlContent = generatePayslipHTML(user, mockRecord);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden pb-24">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center space-x-2 sticky top-0 z-10 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold text-slate-900">Payroll</h2>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
            <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-widest">Net Pay</p>
            <h1 className="text-4xl font-bold mb-4">₹{currentMonthData.netPay.toLocaleString('en-IN')}</h1>
            <div className="flex justify-between items-end">
                <div><p className="text-sm font-medium text-slate-300">{currentMonthData.month}</p><p className="text-[10px] text-slate-500">Annual CTC: ₹{(currentMonthData.ctc).toLocaleString()}</p></div>
                <button onClick={() => handleDownload(undefined, "Payslip_Current")} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg backdrop-blur-md transition-colors" title="Download Latest Slip"><DownloadIcon className="w-6 h-6" /></button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-2 mb-4"><div className="w-2 h-2 rounded-full bg-green-500"></div><h3 className="font-bold text-slate-700 uppercase text-xs">Earnings</h3></div>
                <div className="space-y-3">
                    {currentMonthData.earnings.map((item, idx) => (<div key={idx} className="flex justify-between text-sm"><span className="text-slate-500">{item.label}</span><span className="font-bold text-slate-800">₹{item.amount.toLocaleString()}</span></div>))}
                    <div className="border-t border-slate-50 pt-3 mt-1 flex justify-between"><span className="font-bold text-slate-900 text-sm">Total Earnings</span><span className="font-bold text-green-600 text-sm">₹{currentTotalEarnings.toLocaleString()}</span></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-2 mb-4"><div className="w-2 h-2 rounded-full bg-red-500"></div><h3 className="font-bold text-slate-700 uppercase text-xs">Deductions</h3></div>
                <div className="space-y-3">
                    {currentMonthData.deductions.map((item, idx) => (<div key={idx} className="flex justify-between text-sm"><span className="text-slate-500">{item.label}</span><span className="font-bold text-slate-800">₹{item.amount.toLocaleString()}</span></div>))}
                    <div className="border-t border-slate-50 pt-3 mt-1 flex justify-between"><span className="font-bold text-slate-900 text-sm">Total Deductions</span><span className="font-bold text-red-600 text-sm">₹{currentTotalDeductions.toLocaleString()}</span></div>
                </div>
            </div>
        </div>

        <div className="mt-6 pb-6">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Payslip History</h3>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {myPayrollRecords.length === 0 ? <div className="p-6 text-center text-slate-400 text-xs">No payslips uploaded yet.</div> : 
                    <div className="divide-y divide-slate-50">
                        {myPayrollRecords.map(rec => (
                             <div key={rec.id} className="flex items-center p-4 hover:bg-slate-50 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 mr-3"><FileTextIcon className="w-4 h-4" /></div>
                                <div className="flex-1"><h4 className="text-sm font-bold text-slate-700">Payslip - {rec.month}</h4><p className="text-[10px] text-slate-400">Processed on {new Date(rec.createdDate).toLocaleDateString()}</p></div>
                                <div className="text-right mr-4"><span className="block text-xs font-bold text-slate-800">₹{rec.netPay.toLocaleString()}</span><span className="text-[10px] text-green-600 font-bold uppercase">{rec.status}</span></div>
                                <button onClick={() => handleDownload(rec, `Payslip_${rec.month}`)} className="text-blue-600 hover:text-blue-800"><DownloadIcon className="w-5 h-5" /></button>
                             </div>
                        ))}
                    </div>
                }
            </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollView;
