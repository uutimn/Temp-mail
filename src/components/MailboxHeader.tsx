/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, Menu, Shield } from 'lucide-react';

interface MailboxHeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isSyncing: boolean;
  onRefresh: () => void;
  hasGemini: boolean;
}

export default function MailboxHeader({
  darkMode,
  setDarkMode,
  isSyncing,
  onRefresh,
  hasGemini
}: MailboxHeaderProps) {
  return (
    <header className="bg-[#00a2ff] text-white shadow-md z-40 relative">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Brand Logo - Styled exactly like temp-mail.io screenshots */}
        <div className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded-md bg-white text-[#00a2ff] flex items-center justify-center font-black text-sm select-none shadow-sm">
            t
          </div>
          <span className="font-sans font-bold text-lg text-white select-none tracking-normal">
            temp-mail
          </span>
        </div>

        {/* Action Controls matching screenshots */}
        <div className="flex items-center gap-3">
          
          {/* Refresh Action Trigger */}
          <button
            id="header-refresh-btn"
            onClick={onRefresh}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 active:scale-95 transition-all relative group"
            title="Update mailbox"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Premium tag exactly formatted - Yellow badge */}
          <button
            id="header-premium-btn"
            className="bg-[#ffa800] hover:bg-[#e09400] text-white text-[11px] font-bold px-3 py-1 rounded-sm tracking-wide transition-colors active:scale-95 shadow-sm"
          >
            Try
          </button>

          {/* Hamburger Menu button */}
          <button
            id="header-menu-btn"
            className="p-1 px-1.5 border border-white/20 hover:border-white/40 text-white rounded-md active:scale-95 transition-all"
          >
            <Menu className="w-4.5 h-4.5 text-white" />
          </button>

        </div>

      </div>
    </header>
  );
}
