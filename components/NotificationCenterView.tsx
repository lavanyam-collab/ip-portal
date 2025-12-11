
import React, { useState } from 'react';
import { AppNotification } from '../types';
import { ChevronLeftIcon, TrashIcon, CheckCircleIcon, LifeBuoyIcon, BellIcon, MailIcon, ChevronRightIcon } from './Icons';

interface NotificationCenterViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onBack: () => void;
  onAction: (notification: AppNotification) => void;
}

const NotificationCenterView: React.FC<NotificationCenterViewProps> = ({ notifications, onMarkRead, onClearAll, onBack, onAction }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => {
      if (activeTab === 'unread') return !n.read;
      return true;
  }).sort((a,b) => b.timestamp - a.timestamp);

  const getIcon = (type: string, category?: string) => {
      if (category === 'system' && type === 'warning') return <LifeBuoyIcon className="w-5 h-5 text-orange-600" />;
      if (type === 'success') return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      if (type === 'error') return <LifeBuoyIcon className="w-5 h-5 text-red-600" />;
      return <BellIcon className="w-5 h-5 text-blue-600" />;
  };

  const getBgColor = (type: string) => {
      if (type === 'success') return 'bg-green-50';
      if (type === 'warning') return 'bg-orange-50';
      if (type === 'error') return 'bg-red-50';
      return 'bg-blue-50';
  };

  const handleNotificationClick = (notification: AppNotification) => {
      onMarkRead(notification.id);
      onAction(notification);
  };

  return (
    <div className="bg-slate-50 h-full flex flex-col overflow-hidden pb-24">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-2">
              <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                  <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
          </div>
          {notifications.length > 0 && (
              <button onClick={onClearAll} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
                  <TrashIcon className="w-5 h-5" />
              </button>
          )}
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-4 bg-white border-b border-slate-50 shrink-0">
          <button onClick={() => setActiveTab('all')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'all' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>All</button>
          <button onClick={() => setActiveTab('unread')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'unread' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>Unread</button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <BellIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No notifications</p>
              </div>
          ) : (
              filteredNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer group active:scale-[0.98] ${notification.read ? 'bg-white border-slate-100 opacity-80' : 'bg-white border-blue-100 shadow-sm'}`}
                  >
                      {!notification.read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>}
                      <div className="flex items-start space-x-3 pr-6">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBgColor(notification.type)}`}>
                              {getIcon(notification.type, notification.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-bold ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>{notification.title}</h4>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{notification.message}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-[10px] text-slate-400 font-medium">{new Date(notification.timestamp).toLocaleString()}</span>
                                  {notification.sentViaEmail && (
                                      <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                          <MailIcon className="w-3 h-3" />
                                          <span>Email Sent</span>
                                      </span>
                                  )}
                              </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default NotificationCenterView;
