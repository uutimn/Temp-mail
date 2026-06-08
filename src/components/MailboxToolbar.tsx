/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Edit2, RotateCw, Trash2, ChevronDown, CheckSquare, XSquare, ShieldAlert } from 'lucide-react';

interface MailboxToolbarProps {
  email: string;
  onRefresh: () => void;
  onDeleteAndReset: () => void;
  onChangeAddress: (username: string, domain: string) => Promise<boolean>;
  onClearAll: () => void;
  domains: string[];
  isSyncing: boolean;
}

export default function MailboxToolbar({
  email,
  onRefresh,
  onDeleteAndReset,
  onChangeAddress,
  onClearAll,
  domains,
  isSyncing
}: MailboxToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  
  // Custom address hooks
  const initialUsername = email.includes('@') ? email.split('@')[0] : '';
  const initialDomain = email.includes('@') ? email.split('@')[1] : domains[0] || 'tempmail.io';
  
  const [newUsername, setNewUsername] = useState(initialUsername);
  const [newDomain, setNewDomain] = useState(initialDomain);
  const [errorText, setErrorText] = useState('');
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);

  React.useEffect(() => {
    if (email) {
      const parts = email.split('@');
      setNewUsername(parts[0]);
      if (parts[1]) setNewDomain(parts[1]);
    }
  }, [email]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    
    const sanitized = newUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!sanitized) {
      setErrorText('Username can only contain alphanumeric characters, dots, and hyphens.');
      return;
    }

    setIsSubmittingChange(true);
    try {
      const success = await onChangeAddress(sanitized, newDomain);
      if (success) {
        setIsChanging(false);
      } else {
        setErrorText('Failed to acquire the requested customized domain.');
      }
    } catch (err) {
      setErrorText('An unexpected network interruption occurred.');
    } finally {
      setIsSubmittingChange(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8">
      
      {/* 1. Main Headings - Exactly styled like free temporary email screenshots */}
      <div className="text-center mb-6">
        <h1 className="font-sans font-extrabold text-[#111827] text-3xl md:text-4xl tracking-tight mb-2">
          Free Temporary Email
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Temp mail protects your privacy and keeps your inbox spam-free
        </p>
      </div>

      {/* 2. Container for the input-like Address bar & Action lists */}
      <div className="max-w-xl mx-auto">
        
        {/* White input-style box wrapping email text and copy button inside */}
        <div className="flex items-center justify-between border border-slate-200 bg-white rounded-xl px-4.5 py-3.5 shadow-sm transition-shadow hover:shadow-md">
          <span className="text-slate-700 font-sans font-medium text-base md:text-md select-all truncate tracking-wide">
            {email}
          </span>
          <button
            onClick={copyToClipboard}
            className="text-slate-500 hover:text-[#00a2ff] transition-all p-1 active:scale-90 flex items-center justify-center"
            title="Copy email address"
          >
            {copied ? (
              <span className="text-xs text-emerald-600 font-extrabold font-sans pr-1 bg-emerald-50 px-2 py-0.5 rounded">
                Copied!
              </span>
            ) : (
              <Copy className="w-4.5 h-4.5" />
            )}
          </button>
        </div>

        {/* Action strip row - 100% matched to screenshot 1 link names list */}
        <div className="flex items-center justify-center gap-5 md:gap-7 flex-wrap text-slate-600 font-sans font-medium text-xs md:text-sm mt-4 select-none">
          <button 
            onClick={copyToClipboard} 
            className="flex items-center gap-1.5 hover:text-[#00a2ff] transition-colors py-1.5"
          >
            <Copy className="w-4 h-4 text-slate-500" />
            <span>copy</span>
          </button>

          <button 
            onClick={onDeleteAndReset} 
            className="flex items-center gap-1.5 hover:text-[#00a2ff] transition-colors py-1.5"
          >
            <RotateCw className={`w-4 h-4 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>random</span>
          </button>

          <button 
            onClick={() => { setIsChanging(!isChanging); setIsMoreOpen(false); }} 
            className={`flex items-center gap-1.5 hover:text-[#00a2ff] transition-colors py-1.5 ${isChanging ? 'text-[#00a2ff] font-bold' : ''}`}
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>change</span>
          </button>

          <button 
            onClick={onDeleteAndReset} 
            className="flex items-center gap-1.5 hover:text-[#00a2ff] transition-colors py-1.5"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>delete</span>
          </button>

          <button 
            onClick={() => { setIsMoreOpen(!isMoreOpen); setIsChanging(false); }} 
            className={`flex items-center gap-1.5 hover:text-[#00a2ff] transition-colors py-1.5 ${isMoreOpen ? 'text-[#00a2ff] font-bold' : ''}`}
          >
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isMoreOpen ? 'rotate-180 text-[#00a2ff]' : ''}`} />
            <span>more</span>
          </button>
        </div>

        {/* Inline drawers for actions */}
        {isChanging && (
          <form onSubmit={handleSaveAddress} className="mt-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-[#00a2ff]" /> Custom Email Handle
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-6">
                <input
                  id="edit-prefix-input"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="customprefix"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00a2ff] focus:border-[#00a2ff]"
                />
              </div>

              <div className="md:col-span-4 relative">
                <select
                  id="select-domain-input"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00a2ff] focus:border-[#00a2ff]"
                >
                  {domains.map((dom) => (
                    <option key={dom} value={dom}>
                      @{dom}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="md:col-span-2 flex gap-1">
                <button
                  id="submit-address-btn"
                  type="submit"
                  disabled={isSubmittingChange}
                  className="flex-1 py-2 bg-[#00a2ff] hover:bg-[#008be0] text-white rounded-md text-xs font-bold flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                <button
                  id="cancel-address-btn"
                  type="button"
                  onClick={() => {
                    setIsChanging(false);
                    setErrorText('');
                  }}
                  className="px-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-md text-xs font-medium flex items-center justify-center"
                  title="Close"
                >
                  <XSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {errorText && (
              <p className="mt-2 text-[10px] text-red-500 flex items-center gap-1 font-sans">
                {errorText}
              </p>
            )}
          </form>
        )}

        {isMoreOpen && (
          <div className="mt-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-700 mb-3">Additional Tool Tasks</h3>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  onRefresh();
                  setIsMoreOpen(false);
                }}
                className="px-4 py-2 border border-slate-200 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Sync (Refresh)
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear your current mailbox queue? This can't be undone.")) {
                    onClearAll();
                    setIsMoreOpen(false);
                  }
                }}
                className="px-4 py-2 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-md text-xs font-bold transition-colors"
              >
                Clear Inbox
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
