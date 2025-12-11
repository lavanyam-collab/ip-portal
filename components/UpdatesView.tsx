
import React, { useState, useRef } from 'react';
import { EmployeeUpdate, UserProfile } from '../types';
import { summarizeUpdates } from '../services/geminiService';
import { PlusIcon, UploadIcon, FileTextIcon, XIcon, ChevronLeftIcon } from './Icons';

interface UpdatesViewProps {
  updates: EmployeeUpdate[];
  currentUser: UserProfile;
  onAddUpdate: (content: string, attachment?: { url: string, type: 'image' | 'video' | 'pdf', name: string }) => void;
  onBack?: () => void;
}

const UpdatesView: React.FC<UpdatesViewProps> = ({ updates, currentUser, onAddUpdate, onBack }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'pdf' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSummarize = async () => {
    setLoadingSummary(true);
    const allText = updates.map(u => `${u.author}: ${u.content}`).join("\n");
    const result = await summarizeUpdates(allText);
    setSummary(result);
    setLoadingSummary(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setSelectedFile(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          if (file.type.startsWith('image/')) setFileType('image');
          else if (file.type.startsWith('video/')) setFileType('video');
          else if (file.type === 'application/pdf') setFileType('pdf');
          else setFileType(null);
      }
  };

  const clearFile = () => { setSelectedFile(null); setPreviewUrl(null); setFileType(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() && !selectedFile) return;
    let attachment = undefined;
    if (selectedFile && previewUrl && fileType) { attachment = { url: previewUrl, type: fileType, name: selectedFile.name }; }
    onAddUpdate(newContent, attachment);
    setNewContent(''); clearFile(); setIsCreating(false);
  };

  const parseMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) { return <strong key={i} className="font-bold text-yellow-300 drop-shadow-sm">{part.slice(2, -2)}</strong>; }
        return part;
    });
  };

  const canPost = currentUser.isHR;

  return (
    <div className="h-full bg-slate-50 relative flex flex-col overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-10 shadow-sm sticky top-0">
        <div className="flex items-center space-x-2">
            {onBack && (
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"><ChevronLeftIcon className="w-6 h-6" /></button>
            )}
            <div><h2 className="text-xl font-bold text-slate-900 tracking-tight">Company Buzz</h2><p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Feed</p></div>
        </div>
        <div className="flex items-center space-x-2">
             <button onClick={handleSummarize} disabled={loadingSummary} className={`relative overflow-hidden group px-4 py-2 rounded-full font-bold text-xs transition-all shadow-md active:scale-95 ${loadingSummary ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-purple-500/30'}`}>
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -ml-4"></div>
                <div className="flex items-center space-x-1.5 relative z-10">
                    {loadingSummary ? (<span className="animate-pulse">Thinking...</span>) : (<><svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg><span>AI Summary</span></>)}
                </div>
             </button>
             {canPost && !isCreating && (
                <button onClick={() => setIsCreating(true)} className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 active:scale-90 transition-transform"><PlusIcon className="w-5 h-5" /></button>
             )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-6 scroll-smooth">
        {summary && (
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-0.5 rounded-3xl shadow-2xl animate-fade-in relative overflow-hidden group transition-all hover:scale-[1.01]">
                <div className="absolute inset-0 bg-white/5 opacity-50"></div>
                <div className="bg-slate-900/10 backdrop-blur-md p-6 h-full w-full rounded-[22px] relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-500/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <div className="flex items-center space-x-2">
                             <div className="p-1.5 bg-yellow-400 rounded-lg shadow-lg shadow-yellow-500/50 animate-bounce"><svg className="w-4 h-4 text-yellow-900" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></div>
                             <div><h3 className="text-lg font-bold text-white tracking-tight">AI Insights</h3><p className="text-[10px] text-fuchsia-100 font-medium uppercase tracking-wider">Smart Summary</p></div>
                        </div>
                        <button onClick={() => setSummary(null)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"><XIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="text-sm font-medium leading-relaxed relative z-10 text-white/90 space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {summary.split('\n').map((line, i) => {
                            const isBullet = line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-');
                            const cleanLine = line.replace(/^[•*-]\s*/, '');
                            if (!cleanLine.trim()) return null;
                            return (<div key={i} className={`flex items-start ${isBullet ? 'pl-2' : ''}`}>{isBullet && <span className="mr-3 mt-2 w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>}<p className={isBullet ? 'text-indigo-50' : ''}>{parseMarkdown(cleanLine)}</p></div>);
                        })}
                    </div>
                    <div className="absolute bottom-6 left-0 right-0 h-6 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-b-[22px]"></div>
                </div>
            </div>
        )}

        {isCreating && canPost && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in ring-1 ring-slate-900/5 transform transition-all">
                <div className="p-3 border-b border-slate-50 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800 text-sm pl-1">New Announcement</h3><button onClick={() => setIsCreating(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500"><XIcon className="w-4 h-4" /></button></div>
                <form onSubmit={handlePost} className="p-4">
                    <div className="flex space-x-3 mb-4"><img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-slate-100 object-cover" alt="Avatar" /><textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={`What's happening at Interior Plus, ${currentUser.name.split(' ')[0]}?`} className="flex-1 p-2 text-sm bg-transparent outline-none resize-none min-h-[80px] placeholder:text-slate-400 text-slate-800" autoFocus /></div>
                    {previewUrl && (
                        <div className="mb-4 relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                            <button type="button" onClick={clearFile} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm z-10 hover:bg-black/80 transition-colors"><XIcon className="w-3 h-3" /></button>
                            {fileType === 'image' && <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover" />}
                            {fileType === 'video' && <video src={previewUrl} controls className="w-full max-h-64 bg-black" />}
                            {fileType === 'pdf' && (<div className="flex items-center space-x-4 p-4"><div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><FileTextIcon className="w-6 h-6" /></div><span className="font-bold text-sm text-slate-700">{selectedFile?.name}</span></div>)}
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50">
                        <div className="flex space-x-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,application/pdf" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors"><UploadIcon className="w-4 h-4 text-blue-500" /><span>Photo/Video/PDF</span></button>
                        </div>
                        <button type="submit" disabled={!newContent && !selectedFile} className="px-6 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">Post Update</button>
                    </div>
                </form>
            </div>
        )}

        <div className="space-y-6">
            {updates.length === 0 ? (
                <div className="text-center py-20 opacity-50"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl grayscale">📢</span></div><p className="font-bold text-slate-500">No updates yet</p><p className="text-xs text-slate-400 mt-1">Check back later for company news</p></div>
            ) : (
                updates.map((update) => (
                    <div key={update.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 group cursor-default">
                        <div className="p-4 flex items-center justify-between"><div className="flex items-center space-x-3"><img src={update.avatar} alt={update.author} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" /><div><h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{update.author}</h3><div className="flex items-center space-x-2"><span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{update.role}</span><span className="text-[10px] text-slate-300">•</span><span className="text-[10px] text-slate-400 font-medium">{new Date(update.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span></div></div></div></div>
                        <div className="px-5 pb-3"><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{update.content}</p></div>
                        {update.attachmentUrl && (
                            <div className="mt-1 mb-2 mx-2 rounded-xl overflow-hidden shadow-inner">
                                {update.attachmentType === 'image' && (<img src={update.attachmentUrl} alt="Post Attachment" className="w-full h-auto object-cover max-h-[400px] hover:scale-105 transition-transform duration-700" />)}
                                {update.attachmentType === 'video' && (<video src={update.attachmentUrl} controls className="w-full bg-black max-h-[400px]" />)}
                                {update.attachmentType === 'pdf' && (<div className="mx-2 mb-2 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-4 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer group/pdf"><div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0 group-hover/pdf:scale-110 transition-transform"><FileTextIcon className="w-5 h-5" /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-sm text-slate-800 truncate group-hover/pdf:text-indigo-700">{update.attachmentName || 'Attached Document.pdf'}</h4><p className="text-xs text-slate-400 group-hover/pdf:text-indigo-400">PDF Document • Click to view</p></div></div>)}
                            </div>
                        )}
                        <div className="px-4 py-3 border-t border-slate-50 flex items-center space-x-6 bg-slate-50/50"><button className="flex items-center space-x-2 text-slate-400 hover:text-red-500 transition-colors group/btn"><div className="p-1.5 rounded-full group-hover/btn:bg-red-50 transition-colors"><svg className="w-5 h-5 group-active/btn:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div><span className="text-xs font-bold">{update.likes} Likes</span></button><button className="flex items-center space-x-2 text-slate-400 hover:text-indigo-500 transition-colors group/btn"><div className="p-1.5 rounded-full group-hover/btn:bg-indigo-50 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></div><span className="text-xs font-bold">Comment</span></button></div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default UpdatesView;
