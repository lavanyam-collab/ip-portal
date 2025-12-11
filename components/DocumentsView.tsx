


import React, { useState, useRef, useMemo } from 'react';
import { Document, DocumentCategory, UserProfile } from '../types';
import { FolderIcon, FileTextIcon, DownloadIcon, UploadIcon, ChevronLeftIcon, UsersIcon, XIcon, IdCardIcon, TrashIcon } from './Icons';
import { StorageService } from '../services/storage';

interface DocumentsViewProps {
  documents: Document[];
  currentUser: UserProfile;
  allUsers: UserProfile[]; 
  onUpload: (doc: Document) => void;
  onBack: () => void;
  onDelete?: (docId: string) => void;
}

// Logic to group raw categories into UI Folders
const VAULT_STRUCTURE = [
    { id: 'identity', label: 'Identity Proofs', categories: ['identity', 'pan', 'aadhaar'] as DocumentCategory[], icon: IdCardIcon, color: 'text-purple-600 bg-purple-50' },
    { id: 'certificates', label: 'Education & Certs', categories: ['education', 'certificates'] as DocumentCategory[], icon: FileTextIcon, color: 'text-blue-600 bg-blue-50' },
    { id: 'payslips', label: 'Payslips', categories: ['payslips'] as DocumentCategory[], icon: FileTextIcon, color: 'text-emerald-600 bg-emerald-50' },
];

const LETTERS_STRUCTURE = [
    { id: 'onboarding', label: 'Onboarding', categories: ['offer_letter', 'appointment_letter', 'contracts'] as DocumentCategory[], icon: FolderIcon, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'growth', label: 'Appraisals', categories: ['appraisal_letter'] as DocumentCategory[], icon: FolderIcon, color: 'text-orange-600 bg-orange-50' },
    { id: 'exit', label: 'Separation', categories: ['relieving_letter'] as DocumentCategory[], icon: FolderIcon, color: 'text-red-600 bg-red-50' },
];

const DocumentsView: React.FC<DocumentsViewProps> = ({ documents, currentUser, allUsers, onUpload, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'letters' | 'policies' | 'staff_vault'>('vault');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Admin Staff Vault State
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('uncategorized');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine whose documents we are viewing
  const targetUserId = activeTab === 'staff_vault' ? (selectedStaffId || '') : currentUser.id;
  
  // Filter documents for the current view context
  const targetDocs = useMemo(() => {
      if (activeTab === 'policies') return documents.filter(d => !d.ownerId); // Company docs
      if (!targetUserId) return [];
      return documents.filter(d => d.ownerId === targetUserId);
  }, [documents, activeTab, targetUserId]);

  const getFolderContent = (folderId: string, structure: typeof VAULT_STRUCTURE) => {
      const folderDef = structure.find(f => f.id === folderId);
      if (!folderDef) return [];
      return targetDocs.filter(d => folderDef.categories.includes(d.category));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
        if (!uploadTitle) setUploadTitle(e.target.files[0].name.split('.')[0]);
    }
  };

  const handleDownload = (doc: Document) => {
      let fileUrl = doc.url;
      const isMock = !fileUrl || fileUrl === '#';

      if (isMock) {
          // Generate a dummy blob for demonstration so user can "download" something even for mock data
          const content = `DEMO DOCUMENT\n\nTitle: ${doc.title}\nCategory: ${doc.category}\nDate Uploaded: ${new Date(doc.date).toLocaleDateString()}\n\nThis is a placeholder file for demonstration purposes.`;
          const blob = new Blob([content], { type: 'text/plain' });
          fileUrl = URL.createObjectURL(blob);
      }
      
      // Robust download/view method using anchor tag
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = "_blank";
      
      // For mock files, force download name. For cloud files, browser usually handles it or uses Content-Disposition
      if (isMock) {
          link.download = `${doc.title.replace(/\s+/g, '_')}.txt`;
      } else {
          // Try to hint filename for other files
          link.download = doc.title; 
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (isMock) {
          setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { alert("Please select a file."); return; }

    const finalOwnerId = activeTab === 'policies' ? undefined : (activeTab === 'staff_vault' ? selectedStaffId : currentUser.id);
    
    if ((activeTab === 'staff_vault') && !finalOwnerId) { alert("Please select an employee first."); return; }

    setIsSubmitting(true);

    try {
        const path = `documents/${finalOwnerId || 'common'}/${Date.now()}_${selectedFile.name}`;
        let downloadUrl = await StorageService.uploadFile(path, selectedFile, selectedFile.type);
        
        // Fallback for local demo or failed upload if cloud is not active
        if (!downloadUrl || downloadUrl === '#') {
            downloadUrl = URL.createObjectURL(selectedFile);
        }

        const newDoc: Document = {
            id: Date.now().toString(),
            title: uploadTitle,
            type: selectedFile.type === 'application/pdf' ? 'pdf' : 'image', 
            category: uploadCategory,
            date: Date.now(),
            size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`, 
            url: downloadUrl, 
            ownerId: finalOwnerId
        };

        onUpload(newDoc);
        setIsUploading(false);
        
        // Reset Form
        setUploadTitle('');
        setUploadCategory('uncategorized');
        setSelectedFile(null);
    } catch (error) {
        console.error("Upload Error:", error);
        alert("Failed to upload document.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = (docId: string) => {
      if (onDelete) onDelete(docId);
  }

  // Render Folders Grid
  const renderFolders = (structure: typeof VAULT_STRUCTURE) => (
      <div className="grid grid-cols-2 gap-4 animate-fade-in pb-4">
          {structure.map(folder => {
              const count = targetDocs.filter(d => folder.categories.includes(d.category)).length;
              return (
                  <button key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-left group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${folder.color}`}>
                          <folder.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">{folder.label}</h3>
                      <p className="text-xs text-slate-500 mt-1">{count} documents</p>
                  </button>
              );
          })}
          
          {/* Quick Add Button logic - RESTRICTED TO HR */}
          {(activeTab !== 'policies' && currentUser.isHR) && (
             <button onClick={() => setIsUploading(true)} className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                 <UploadIcon className="w-8 h-8 mb-2" />
                 <span className="text-xs font-bold">{activeTab === 'staff_vault' ? 'Upload to Staff' : 'Upload New'}</span>
             </button>
          )}
      </div>
  );

  // Render File List for a Folder
  const renderFileList = (folderId: string, structure: typeof VAULT_STRUCTURE) => {
      const files = getFolderContent(folderId, structure);
      const folderName = structure.find(f => f.id === folderId)?.label || 'Folder';

      return (
          <div className="animate-fade-in pb-4">
              <button onClick={() => setCurrentFolderId(null)} className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 mb-4 px-1">
                  <ChevronLeftIcon className="w-5 h-5" /><span className="font-medium text-sm">Back to Folders</span>
              </button>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800">{folderName}</h3>
                  {/* Upload Restricted to HR */}
                  {currentUser.isHR && (
                      <button onClick={() => setIsUploading(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1">
                          <UploadIcon className="w-3 h-3" /><span>Add</span>
                      </button>
                  )}
              </div>
              <div className="space-y-3">
                  {files.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-sm">No documents in this folder</p>
                      </div>
                  ) : (
                      files.map(doc => {
                          return (
                              <div key={doc.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                                  <div className="flex items-start justify-between">
                                      <div className="flex items-start space-x-3">
                                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                              <FileTextIcon className="w-6 h-6" />
                                          </div>
                                          <div className="min-w-0">
                                              <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{doc.title}</h4>
                                              <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{doc.category.replace(/_/g, ' ')} • {new Date(doc.date).toLocaleDateString()}</p>
                                          </div>
                                      </div>
                                      <div className="flex space-x-1">
                                          <button onClick={() => handleDownload(doc)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg" title="View / Download">
                                              <DownloadIcon className="w-4 h-4" />
                                          </button>
                                          {currentUser.isHR && (
                                              <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg" title="Delete">
                                                  <TrashIcon className="w-4 h-4" />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      );
  };

  const renderUploadModal = () => (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-900">Upload Document</h3>
                  <button onClick={() => !isSubmitting && setIsUploading(false)} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled={isSubmitting}><XIcon className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleUploadSubmit} className="p-4 space-y-4 overflow-y-auto">
                  {/* Context Info */}
                  {activeTab === 'staff_vault' && selectedStaffId && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-center space-x-2 text-xs text-purple-700 font-bold">
                          <UsersIcon className="w-4 h-4" />
                          <span>Uploading for: {allUsers.find(u => u.id === selectedStaffId)?.name}</span>
                      </div>
                  )}

                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                      <input required disabled={isSubmitting} value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-70" placeholder="e.g. Updated Resume" />
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                      <select required disabled={isSubmitting} value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:bg-white disabled:opacity-70">
                          <option value="uncategorized">Select Category...</option>
                          <optgroup label="Identity & Proofs">
                              <option value="pan">PAN Card</option>
                              <option value="aadhaar">Aadhaar Card</option>
                              <option value="identity">Other ID</option>
                          </optgroup>
                          <optgroup label="Education">
                              <option value="education">Degree/Marksheet</option>
                              <option value="certificates">Certificates</option>
                          </optgroup>
                          {(currentUser.isHR) && (
                              <optgroup label="HR Letters">
                                  <option value="offer_letter">Offer Letter</option>
                                  <option value="appointment_letter">Appointment Letter</option>
                                  <option value="appraisal_letter">Appraisal Letter</option>
                                  <option value="relieving_letter">Relieving Letter</option>
                                  <option value="contracts">Contract</option>
                              </optgroup>
                          )}
                          <optgroup label="Others">
                              <option value="payslips">Payslip</option>
                              {activeTab === 'policies' && <option value="policies">Company Policy</option>}
                          </optgroup>
                      </select>
                  </div>

                  <div onClick={() => !isSubmitting && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" disabled={isSubmitting} />
                      {selectedFile ? (
                          <><FileTextIcon className="w-8 h-8 text-green-600 mb-2" /><span className="text-xs font-bold text-green-800 text-center w-full truncate">{selectedFile.name}</span></>
                      ) : (
                          <><UploadIcon className="w-8 h-8 text-slate-400 mb-2" /><span className="text-xs font-bold text-slate-400">Tap to select file</span></>
                      )}
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center">
                      {isSubmitting ? (
                          <span className="flex items-center space-x-2">
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              <span>Uploading...</span>
                          </span>
                      ) : 'Upload Document'}
                  </button>
              </form>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden pb-24">
      {isUploading && renderUploadModal()}
      
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2 border-b border-slate-100 shrink-0 z-10">
        <div className="flex items-center space-x-2 mb-4">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ChevronLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-slate-900">Document Vault</h2>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => { setActiveTab('vault'); setCurrentFolderId(null); setSelectedStaffId(null); }} className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${activeTab === 'vault' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>My Vault</button>
            <button onClick={() => { setActiveTab('letters'); setCurrentFolderId(null); setSelectedStaffId(null); }} className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${activeTab === 'letters' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>HR Letters</button>
            <button onClick={() => { setActiveTab('policies'); setCurrentFolderId(null); setSelectedStaffId(null); }} className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${activeTab === 'policies' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>Policies</button>
            {currentUser.isHR && (
                <button onClick={() => { setActiveTab('staff_vault'); setCurrentFolderId(null); }} className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${activeTab === 'staff_vault' ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>Staff Vault</button>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
         {/* STAFF VAULT ADMIN VIEW */}
         {activeTab === 'staff_vault' && (
             <div className="animate-fade-in">
                 {!selectedStaffId ? (
                     <div className="space-y-4">
                         <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                             <h3 className="font-bold text-purple-900 text-sm mb-2">Access Employee Vault</h3>
                             <p className="text-xs text-purple-700 mb-4">Select an employee to view their uploaded documents or issue new HR letters.</p>
                             <div className="relative">
                                <select 
                                    className="w-full p-3 pl-10 border border-purple-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    value=""
                                >
                                    <option value="">Search Employee...</option>
                                    {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                                    ))}
                                </select>
                                <UsersIcon className="w-5 h-5 text-purple-400 absolute left-3 top-3" />
                             </div>
                         </div>
                     </div>
                 ) : (
                     <div>
                         <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                             <div className="flex items-center space-x-3">
                                 <img src={allUsers.find(u => u.id === selectedStaffId)?.avatar} className="w-10 h-10 rounded-full" alt="User" />
                                 <div>
                                     <h3 className="font-bold text-slate-900 text-sm">{allUsers.find(u => u.id === selectedStaffId)?.name}</h3>
                                     <p className="text-xs text-slate-500">Employee Vault</p>
                                 </div>
                             </div>
                             <button onClick={() => setSelectedStaffId(null)} className="text-slate-400 hover:text-slate-600 p-2"><XIcon className="w-5 h-5" /></button>
                         </div>
                         
                         {/* Staff Sections */}
                         <div className="space-y-6">
                             <div>
                                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">Personal Documents</h4>
                                 {currentFolderId ? renderFileList(currentFolderId, VAULT_STRUCTURE) : renderFolders(VAULT_STRUCTURE)}
                             </div>
                             {!currentFolderId && (
                                 <div>
                                     <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">HR Letters & Contracts</h4>
                                     {renderFolders(LETTERS_STRUCTURE)}
                                 </div>
                             )}
                         </div>
                     </div>
                 )}
             </div>
         )}

         {/* USER VIEWS */}
         {activeTab === 'vault' && (
             currentFolderId ? renderFileList(currentFolderId, VAULT_STRUCTURE) : renderFolders(VAULT_STRUCTURE)
         )}

         {activeTab === 'letters' && (
             currentFolderId ? renderFileList(currentFolderId, LETTERS_STRUCTURE) : renderFolders(LETTERS_STRUCTURE)
         )}

         {activeTab === 'policies' && (
             <div className="space-y-3 animate-fade-in">
                 {targetDocs.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">No policies published yet.</div> : targetDocs.map(doc => (
                     <div key={doc.id} className="flex items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                         <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 shrink-0"><FileTextIcon className="w-6 h-6" /></div>
                         <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-slate-800 text-sm truncate">{doc.title}</h4>
                             <p className="text-xs text-slate-400">{new Date(doc.date).toLocaleDateString()} • {doc.size}</p>
                         </div>
                         <div className="flex space-x-1">
                             <button onClick={() => handleDownload(doc)} className="p-2 text-slate-400 hover:text-indigo-600"><DownloadIcon className="w-5 h-5" /></button>
                             {currentUser.isHR && <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>}
                         </div>
                     </div>
                 ))}
                 {/* Policy Upload: HR Only */}
                 {currentUser.isHR && (
                     <button onClick={() => setIsUploading(true)} className="fixed bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-[60]"><UploadIcon className="w-6 h-6" /></button>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};

export default DocumentsView;