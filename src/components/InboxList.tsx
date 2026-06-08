/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Inbox, ShieldCheck, Users, CreditCard, RotateCw } from 'lucide-react';
import { EmailMessage } from '../types';

interface InboxListProps {
  emails: EmailMessage[];
  selectedId: string | null;
  onOpenMessage: (email: EmailMessage) => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

type CategoryTab = 'all' | 'primary' | 'security' | 'social';

export default function InboxList({
  emails,
  selectedId,
  onOpenMessage,
  onRefresh,
  isSyncing = false
}: InboxListProps) {
  const [activeSubTab, setActiveSubTab] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Human friendly time formatting
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const filteredEmails = emails.filter((mail) => {
    const matchesSearch =
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full min-h-[460px] shadow-sm">
      
      {/* 1. Exactly styled Messages/Saved tabs with Refresh arrow on top right */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 bg-white select-none">
        <div className="flex gap-4">
          <button className="text-sm font-extrabold text-slate-800 border-b-2 border-indigo-600 pb-1.5 px-0.5">
            Messages
          </button>
          <button className="text-sm font-medium text-slate-400 hover:text-slate-600 pb-1.5 px-0.5 transition-colors">
            Saved
          </button>
        </div>
        
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-sans py-1"
          title="Update Inbox feed"
        >
          <RotateCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>refresh</span>
        </button>
      </div>

      {/* Lightweight search panel to maximize utility without heavy weight */}
      <div className="p-3 border-b border-slate-50 bg-slate-50/20 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="inbox-search"
            type="text"
            placeholder="Search sender, codes, or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 2. Message List Area / Spinning loader blank state matching Screenshot 1 */}
      <div className="flex-1 overflow-y-auto min-h-[360px] flex flex-col">
        {filteredEmails.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-white">
            
            {/* Spinning clean outline loader matching Screenshot 1 exactly */}
            <div className="relative mb-4">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            
            <h4 className="font-sans font-extrabold text-slate-800 text-sm tracking-tight">
              No messages
            </h4>
            
            <p className="text-xs text-slate-400 mt-1.5 font-normal max-w-[200px] leading-relaxed">
              Waiting for incoming messages
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white">
            {filteredEmails.map((mail) => {
              const isSelected = selectedId === mail.id;
              return (
                <button
                  id={`mail-row-${mail.id}`}
                  key={mail.id}
                  onClick={() => onOpenMessage(mail)}
                  className={`w-full text-left p-4 flex gap-3 transition-colors duration-100 relative ${
                    isSelected
                      ? 'bg-indigo-50/30'
                      : !mail.read
                      ? 'bg-slate-50/40 hover:bg-slate-50/80 font-bold'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Sender initials Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 bg-indigo-50 text-indigo-600`}>
                    {mail.avatar?.substring(0, 2) || "S"}
                  </div>

                  {/* Body text meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-xs truncate ${!mail.read ? 'font-extrabold text-slate-950' : 'font-medium text-slate-600'}`}>
                        {mail.senderName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 pl-2">
                        {formatTime(mail.receivedAt)}
                      </span>
                    </div>

                    <h4 className={`text-xs truncate mb-1 ${!mail.read ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                      {mail.subject}
                    </h4>

                    {/* OTP Highlight */}
                    {mail.otpCode && (
                      <span className="inline-block px-1.5 py-0.2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-mono font-bold mt-1">
                        OTP: {mail.otpCode}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
