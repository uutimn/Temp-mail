/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MailOpen, Copy, Check, Calendar, ArrowLeft, ShieldAlert } from 'lucide-react';
import { EmailMessage } from '../types';

interface MessageViewProps {
  email: EmailMessage | null;
  onBackToList?: () => void; // For responsive mobile views
}

export default function MessageView({ email, onBackToList }: MessageViewProps) {
  const [copiedOtp, setCopiedOtp] = useState(false);

  if (!email) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-lg h-full flex flex-col items-center justify-center p-8 text-center transition-all duration-200 min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
          <MailOpen className="w-8 h-8" />
        </div>
        <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 text-base">
          No message selected
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1.5 leading-relaxed">
          Select an incoming notification or testing email from the feed to inspect verification headers, sandbox code blocks, or HTML contents.
        </p>
      </div>
    );
  }

  const handleCopyOtp = () => {
    if (email.otpCode) {
      navigator.clipboard.writeText(email.otpCode);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  // Human date translation
  const fullDate = new Date(email.receivedAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-lg h-full flex flex-col overflow-hidden transition-all duration-200 min-h-[500px]">
      
      {/* Header controls bar */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        
        {/* Mobile slide return */}
        <div className="flex items-center gap-2">
          {onBackToList && (
            <button
              id="back-to-inbox-btn"
              onClick={onBackToList}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg active:scale-95 transition-all"
              title="Return to inbox"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
            Email Message
          </span>
        </div>
      </div>

      {/* Message Metadata panels */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
        
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider mb-2.5 ${
            email.category === 'security'
              ? 'bg-rose-500/10 text-rose-500'
              : email.category === 'billing'
              ? 'bg-purple-500/10 text-purple-500'
              : email.category === 'social'
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-blue-500/10 text-blue-500'
          }`}>
            {email.category}
          </span>
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-base md:text-lg tracking-tight select-all">
            {email.subject}
          </h2>
        </div>

        {/* Sender details and timestamp */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Avatar and Email Moniker */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
              {email.avatar || "S"}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{email.senderName}</div>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 select-all">&lt;{email.sender}&gt;</div>
            </div>
          </div>

          {/* Recipient / Timestamp info */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 space-y-0.5 text-left md:text-right font-mono">
            <div><span className="font-sans font-medium">To:</span> {email.recipient}</div>
            <div className="flex items-center gap-1 md:justify-end">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{fullDate}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Highlight/Detected Verification Code OTP Block */}
      {email.otpCode && (
        <div className="mx-6 mt-4 p-4.5 bg-blue-500/5 border border-blue-500/15 dark:border-blue-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4.5">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 uppercase tracking-wider">
              Verification Code Detected
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-normal mt-0.5">
              Copy this transient passcode to satisfy the validation screen directly.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-5 py-2.5 bg-blue-500 text-white font-mono font-black text-lg tracking-widest rounded-xl select-all shadow-md shadow-blue-500/10">
              {email.otpCode}
            </span>
            <button
              id="copy-otp-btn"
              onClick={handleCopyOtp}
              className={`p-3 rounded-xl transition-all active:scale-95 duration-100 flex items-center justify-center ${
                copiedOtp
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/25'
              }`}
              title="Copy OTP to clipboard"
            >
              {copiedOtp ? <Check className="w-5 h-5 animate-bounce" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Safe Visual IFrame container for HTML email */}
      <div className="flex-1 p-6 flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block select-none">
          Message Content
        </span>
        
        {/* Responsive, completely isolated sandbox viewport */}
        <div className="flex-1 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden bg-white min-h-[300px] h-full shadow-inner relative">
          <iframe
            id="email-iframe-viewer"
            title="Safe sandboxed email viewport"
            sandbox="allow-same-origin"
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <style>
                    html, body {
                      margin: 0;
                      padding: 16px;
                      background-color: #ffffff;
                      color: #000000;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      font-size: 14px;
                    }
                    /* Ensure scroll behaviors layout nicely */
                    ::-webkit-scrollbar {
                      width: 8px;
                      height: 8px;
                    }
                    ::-webkit-scrollbar-track {
                      background: #f1f1f1;
                    }
                    ::-webkit-scrollbar-thumb {
                      background: #c1c1c1;
                      border-radius: 4px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                      background: #a8a8a8;
                    }
                  </style>
                </head>
                <body>
                  ${email.body}
                </body>
              </html>
            `}
            className="w-full h-full border-0 absolute inset-0"
          />
        </div>
      </div>

    </div>
  );
}
