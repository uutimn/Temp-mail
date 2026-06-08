/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, HelpCircle, Activity, Globe, Compass, Cpu, CheckSquare } from 'lucide-react';
import MailboxHeader from './components/MailboxHeader.tsx';
import MailboxToolbar from './components/MailboxToolbar.tsx';
import SimulatorPanel from './components/SimulatorPanel.tsx';
import InboxList from './components/InboxList.tsx';
import MessageView from './components/MessageView.tsx';
import MailboxFAQ from './components/MailboxFAQ.tsx';
import { EmailMessage } from './types';

export default function App() {
  // Theme and UI Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const cached = localStorage.getItem('temp_mail_darkMode');
    return cached ? cached === 'true' : false; // Default to white interface (light mode) on first load
  });

  // Mailbox Session Details
  const [email, setEmail] = useState<string>('');
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [domains, setDomains] = useState<string[]>(['tempmail.io']);
  const [hasGemini, setHasGemini] = useState<boolean>(false);

  // States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isMobileReading, setIsMobileReading] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // 1. Sync Dark Mode colors class
  useEffect(() => {
    localStorage.setItem('temp_mail_darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 2. Fetch Config on Boot
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.domains) setDomains(data.domains);
          setHasGemini(data.hasGemini);
        }
      } catch (err) {
        console.error('Issue loading configuration parameters:', err);
      }
    }
    fetchConfig();
  }, []);

  // 3. Setup/Acquire Active Mailbox
  async function syncMailbox(targetEmail?: string) {
    setIsSyncing(true);
    try {
      let queryUrl = '/api/mailbox';
      if (targetEmail) {
        queryUrl += `?email=${encodeURIComponent(targetEmail)}`;
      }
      
      const res = await fetch(queryUrl);
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email);
        setEmails(data.emails);
        localStorage.setItem('temp_mail_address', data.email);
        
        // Align active reader selections gracefully
        if (selectedEmail) {
          const updated = data.emails.find((m: EmailMessage) => m.id === selectedEmail.id);
          if (updated) setSelectedEmail(updated);
        }
      }
    } catch (err) {
      console.error('Problem refreshing mailbox stream:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  // Load existing session address
  useEffect(() => {
    const saved = localStorage.getItem('temp_mail_address');
    syncMailbox(saved || undefined);
  }, []);

  // Real-time inbox Polling cycle (Every 30 seconds to optimize storage and pipeline load)
  useEffect(() => {
    if (!email) return;
    const interval = setInterval(() => {
      syncMailbox(email);
    }, 30000);
    return () => clearInterval(interval);
  }, [email, selectedEmail]);

  // Handle manual Refresh
  const handleManualRefresh = async () => {
    await syncMailbox(email);
  };

  // Create clean new randomized Address
  const handleNewAddressAndReset = async () => {
    setIsSyncing(true);
    setSelectedEmail(null);
    setIsMobileReading(false);
    try {
      const res = await fetch('/api/mailbox/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email);
        setEmails(data.emails);
        localStorage.setItem('temp_mail_address', data.email);
      }
    } catch (err) {
      console.error('Issue resetting active location:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Change address prefix/domain moniker
  const handleChangeAddress = async (username: string, domain: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/mailbox/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, domain })
      });
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email);
        setEmails(data.emails);
        localStorage.setItem('temp_mail_address', data.email);
        setSelectedEmail(null);
        setIsMobileReading(false);
        return true;
      }
    } catch (err) {
      console.error('Error switching email target:', err);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  // Wipe messages
  const handleClearInbox = async () => {
    setIsSyncing(true);
    setSelectedEmail(null);
    try {
      const res = await fetch('/api/mailbox/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setEmails([]);
      }
    } catch (err) {
      console.error('Error wiping message indexes:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger simulated receives on client-interaction
  const handleSimulateReceive = async (scenario: string, options: any = {}): Promise<boolean> => {
    try {
      const res = await fetch('/api/mailbox/simulate-receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          scenario,
          ...options
        })
      });
      if (res.ok) {
        await syncMailbox(email);
        return true;
      }
    } catch (err) {
      console.error('Simulated receive endpoint failure:', err);
    }
    return false;
  };

  // Clicking an email (Read confirmation updates server-side)
  const handleOpenMessage = async (msg: EmailMessage) => {
    setSelectedEmail(msg);
    setIsMobileReading(true);
    
    if (!msg.read) {
      // Optmistic UI
      setEmails(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      try {
        await fetch('/api/mailbox/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, id: msg.id })
        });
      } catch (err) {
        console.error('Read receipt registration failure:', err);
      }
    }
  };

  // FAQs questions and answers matching screenshots 2 & 3
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqsData = [
    {
      q: "What is a temporary / disposable / anonymous mail?",
      a: "Disposable temporary email is a free email service that allows to receive email at a temporary address that self-destructs after a certain time elapses. It protects your personal mailbox from spam, advertising mailings, malware and hackers."
    },
    {
      q: "Why do you need a temporary email address?",
      a: "To protect your personal mailbox from endless promotional spam, newsletters, and potential security leaks when signing up for web services, forums, or online trials."
    },
    {
      q: "Do you read messages?",
      a: "All temporary mail belongs to you exclusively. We do not inspect received emails, and any data is automatically purged to keep you anonymous."
    },
    {
      q: "How long does temp mail last?",
      a: "Your mailbox is completely stable and remains active indefinitely unless you choose to delete or refresh it yourself."
    },
    {
      q: "What is the difference of disposable mail from the usual email?",
      a: "It is completely anonymous, requires zero registration, creates instantly in one click, and self-clears over time to prevent clutter."
    },
    {
      q: "How to send email?",
      a: "Our temporary email is designed exclusively for incoming verification emails and security alerts. Sending outward emails is deactivated to avoid spam abuse."
    },
    {
      q: "How to delete a temporary email?",
      a: "Simply click the 'delete' link right below your email address to instantly discard the current handle and acquire a fresh, blank mailbox handle."
    },
    {
      q: "Do you have browser extension?",
      a: "Yes! We support Chrome, Firefox, Opera, and Edge browser extensions for easy one-click email generation on any page."
    },
    {
      q: "I found mistake/bug. How can I report it?",
      a: "Please drop us a message via our Contact page or submit a github issue directly to our developer team."
    },
    {
      q: "Can I check the received emails?",
      a: "Absolutely, they appear instantly in real-time in the messages panel below with zero page reload needed."
    },
    {
      q: "Is temp mail safe?",
      a: "Yes! Your real IP and private records are never recorded, keeping your digital identity 105% isolated."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#334155] font-sans antialiased flex flex-col justify-between selection:bg-indigo-100">
      
      {/* 1. Header Navigation - 100% Purple Exactly like image */}
      <MailboxHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isSyncing={isSyncing}
        onRefresh={handleManualRefresh}
        hasGemini={hasGemini}
      />

      {/* 2. Main Body Content - Aligned exactly like the screenshots */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pb-16">
        
        {/* Centered Email Handle Tool area */}
        <MailboxToolbar
          email={email}
          onRefresh={handleManualRefresh}
          onDeleteAndReset={handleNewAddressAndReset}
          onChangeAddress={handleChangeAddress}
          onClearAll={handleClearInbox}
          domains={domains}
          isSyncing={isSyncing}
        />

        {/* Centralized Mail Inbox List Area - Messages / Saved */}
        <div id="messages-list-wrapper" className="mt-8 max-w-xl mx-auto">
          {selectedEmail ? (
            <div className="animate-fadeIn">
              <MessageView
                email={selectedEmail}
                onBackToList={() => setSelectedEmail(null)}
              />
            </div>
          ) : (
            <div className="animate-fadeIn">
              <InboxList
                emails={emails}
                selectedId={null}
                onOpenMessage={handleOpenMessage}
                onRefresh={handleManualRefresh}
                isSyncing={isSyncing}
              />
            </div>
          )}
        </div>

        {/* 3. Section: "What is disposable temporary email?" with illustrated real-life diagram of how to use */}
        <div id="how-to-use-section" className="mt-16 bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          <div className="md:col-span-6 flex flex-col justify-center">
            <h2 className="font-sans font-bold text-slate-900 text-xl md:text-2xl mb-4 leading-snug">
              What is disposable temporary email?
            </h2>
            <p className="text-[#475569] text-xs md:text-sm leading-relaxed mb-3">
              <strong className="text-slate-900">Disposable temporary email</strong> protects your real email address from spam, advertising mailings, and malwares. It's anonymous and free. If this email will not receive messages for some time—it will be automatically removed. 
            </p>
            <p className="text-[#475569] text-xs md:text-sm leading-relaxed">
              It is also called <strong className="text-slate-800">"throwaway email"</strong>, <strong className="text-slate-800">"10 minute mail"</strong>, <strong className="text-slate-800">"temp-mail"</strong>, and <strong className="text-slate-800">"trash mail"</strong>. Temporary email can be used to hide your real mail: social networks, public Wi-Fi access spots, blogs and forums often require users to register before accessing their content.
            </p>
          </div>
          
          {/* Real-life step-by-step illustrated diagram */}
          <div className="md:col-span-6 bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-4 select-none font-sans">
              How to use temp-mail:
            </h3>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3.5 items-start">
                <div className="w-6 h-6 rounded-full bg-[#00a2ff] text-white flex items-center justify-center font-bold text-xs select-none shadow-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none mb-1">Copy Temporary Handle</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Generate and copy your pre-allocated credentials directly from our interactive toolbox above.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3.5 items-start">
                <div className="w-6 h-6 rounded-full bg-[#00a2ff] text-white flex items-center justify-center font-bold text-xs select-none shadow-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none mb-1">Enter Into Web Portals</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Submit this temporary email to networks, download files, or setup trial validation accounts.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3.5 items-start">
                <div className="w-6 h-6 rounded-full bg-[#00a2ff] text-white flex items-center justify-center font-bold text-xs select-none shadow-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none mb-1">Collect Verification Letters</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Your verification keys, activation links or documents download buttons appear instantly in real-time below.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Section: Apps and extensions grid list */}
        <div className="mt-16 text-center">
          <h2 className="font-sans font-bold text-slate-900 text-xl md:text-2xl">
            Apps and extensions
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2 mb-8 max-w-md mx-auto leading-relaxed">
            Enjoy convenient access to generate temporary emails instantly with our lightweight extensions and bots
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl mx-auto">
            
            {/* App Store (iOS) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-indigo-300 transition-all active:scale-95">
              <svg className="w-8 h-8 mb-2 text-[#0070c9]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.6.69-1.12 1.83-.98 2.94 1.08.08 2.22-.55 2.91-1.37z" />
              </svg>
              <span className="text-[11px] font-bold text-slate-700">App Store</span>
            </div>

            {/* Google Play */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-indigo-300 transition-all active:scale-95">
              <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.25 2.75v18.5a.75.75 0 0 0 1.15.63l15.5-9.25a.75.75 0 0 0 0-1.26L4.4 2.12a.75.75 0 0 0-1.15.63z" fill="url(#playGrad)" />
                <defs>
                  <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0F9D58" />
                    <stop offset="40%" stopColor="#DB4437" />
                    <stop offset="70%" stopColor="#F4B400" />
                    <stop offset="100%" stopColor="#4285F4" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-[11px] font-bold text-slate-700">Google Play</span>
            </div>

            {/* Chrome */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-indigo-300 transition-all active:scale-95">
              <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#ECEFF1" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#90A4AE" />
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#4285F4" />
                <path d="M12 2a10 10 0 0 0-8.66 5l4.33 7.5A6 6 0 0 1 12 6h8.66A10 10 0 0 0 12 2z" fill="#EA4335" />
                <path d="M20.66 6h-8.66a6 6 0 0 1 4.33 7.5l4.33-7.5zm.33.5c-.34-.1-.7-.16-1.07-.16a10 10 0 0 0-8.58 4.84l4.33 7.5a6 6 0 0 1 5.32-12.18z" fill="#FBBC05" />
                <path d="M12 18a6 6 0 0 1-5.33-3.25l-4.33 7.5C4.54 21.03 8.13 22 12 22a10 10 0 0 0 8.66-5l-4.33-7.5A6 6 0 0 1 12 18z" fill="#34A853" />
              </svg>
              <span className="text-[11px] font-bold text-slate-700">Chrome</span>
            </div>

            {/* Firefox */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-indigo-300 transition-all active:scale-95">
              <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#2E1C4E" />
                <path d="M12 2a10 10 0 0 0-7.5 16.6 6 6 0 0 1 8-6.1c3.1 1.2 4.5 4.5 3 7.5 4.1-2.9 5-8.5 2.1-12.6A9.9 9.9 0 0 0 12 2z" fill="#FF8D24" />
                <path d="M12 20a8 8 0 0 1-5.3-2 6 6 0 0 1 8.3-7c1 .6 1.8 1.6 2 2.7-.3 1.6-1.5 3.5-5 6.3z" fill="#D62828" />
              </svg>
              <span className="text-[11px] font-bold text-slate-700">Firefox</span>
            </div>

            {/* Opera */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-indigo-300 transition-all active:scale-95 col-span-1">
              <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="12" cy="12" rx="9" ry="9" fill="#FF1B2D" />
                <ellipse cx="12" cy="12" rx="3.5" ry="6.5" fill="#FFFFFF" />
              </svg>
              <span className="text-[11px] font-bold text-slate-700">Opera</span>
            </div>

            {/* Edge */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-indigo-300 transition-all active:scale-95 col-span-1">
              <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 12c0-5.25 4.25-9.5 9.5-9.5s9.5 4.25 9.5 9.5a9.5 9.5 0 0 1-19 0z" fill="url(#edgeGrad)" />
                <defs>
                  <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00c3ff" />
                    <stop offset="50%" stopColor="#1e29eb" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <path d="M3.5 10.5c1.5-3.5 5-5.5 8.5-5.5s7.5 3 7 7c-.5 4-5.5 6.5-9 5s-6-4.5-6.5-6.5z" fill="#0EA5E9" />
              </svg>
              <span className="text-[11px] font-bold text-slate-700">Edge</span>
            </div>

            {/* Telegram */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-indigo-300 transition-all active:scale-95 col-span-2">
              <svg className="w-8 h-8 mb-2 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="#229ED9" />
                <path d="M16.5 8.2l-2.2 10.3c-.2.8-.6 1-1.3.6l-3.3-2.4-1.6 1.5c-.2.2-.3.3-.4.3l.2-2.7 4.9-4.4c.2-.2 0-.3-.2-.2L6.5 13.9l-2.6-.8c-.6-.2-.6-.6.1-.8l10.2-3.9c.5-.2 1 .1.8 1.1z" fill="white" />
              </svg>
              <span className="text-[11px] font-bold text-slate-700">Telegram</span>
            </div>

          </div>
        </div>

        {/* 5. Section: Frequently asked questions list wrapped in clean card */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="font-sans font-bold text-slate-900 text-xl md:text-2xl text-center mb-6">
            Frequently asked questions
          </h2>
          
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
            {faqsData.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="transition-all duration-150">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-5 py-3.5 flex items-center justify-between text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs md:text-sm font-bold text-slate-800 leading-snug">
                      {item.q}
                    </span>
                    <span className="text-slate-400 pl-4">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs font-normal text-slate-500 leading-relaxed bg-slate-50/10">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <p className="text-center text-[10px] text-slate-400 mt-4 leading-normal">
            Couldn't find something? Learn more in our <span onClick={() => document.getElementById('how-to-use-section')?.scrollIntoView({ behavior: 'smooth' })} className="underline cursor-pointer text-[#00a2ff] font-bold">help center</span>.
          </p>
        </div>

        {/* 6. Section: Latest blog posts - Styled with real articles and NO blue/purple heads */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-sans font-bold text-slate-900 text-xl md:text-2xl">
                Latest blog posts
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Stay informed, stay secure: privacy insights and our developer guides
              </p>
            </div>
            
            <button className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-full text-xs font-bold text-[#475569] transition-colors">
              Read all posts
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Guide 1: Emerald/Sage theme */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-[#E6F9F2] flex items-center justify-center relative p-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#10B981] flex items-center justify-center text-white text-xl font-bold font-sans shadow-md group-hover:scale-105 transition-transform">
                    🛡️
                  </div>
                  <div className="absolute right-3 bottom-0.2 text-[9px] font-mono font-medium text-slate-400">Security Guides</div>
                </div>
                <div className="p-4.5">
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 font-sans leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                    Securing Your Mail on Public Web Forums
                  </h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">
                    Learn why forum sites sell subscriber listings to external third-party aggregators, and how throwaway emails securely isolate your workflow.
                  </p>
                </div>
              </div>
            </div>

            {/* Guide 2: Amber/Gold theme */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-[#FFFBEB] flex items-center justify-center relative p-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-white text-xl font-bold font-sans shadow-md group-hover:scale-105 transition-transform">
                    📶
                  </div>
                  <div className="absolute right-3 bottom-0.2 text-[9px] font-mono font-medium text-slate-400">Safety Guides</div>
                </div>
                <div className="p-4.5">
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 font-sans leading-snug group-hover:text-amber-600 transition-colors line-clamp-2">
                    Bypassing Junk Mail Overflows on Public Access Spots
                  </h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">
                    Public airports, hotels, and retail spots demand email authorizations to track user devices. Stay completely private using standard disposable handles.
                  </p>
                </div>
              </div>
            </div>

            {/* Guide 3: Charcoal/Slate theme */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-[#F1F5F9] flex items-center justify-center relative p-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#64748B] flex items-center justify-center text-white text-xl font-bold font-sans shadow-md group-hover:scale-105 transition-transform">
                    ⚙️
                  </div>
                  <div className="absolute right-3 bottom-0.2 text-[9px] font-mono font-medium text-slate-400">QA Workflows</div>
                </div>
                <div className="p-4.5">
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 font-sans leading-snug group-hover:text-slate-600 transition-colors line-clamp-2">
                    Software Integration Testing with Sandbox Mail
                  </h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">
                    Web developers and QA teams often need rapid multi-user verification iterations. Utilize secure sandbox channels to optimize your continuous testing cycles.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 7. Detailed SEO content texts and lists */}
        <div className="mt-20 max-w-2xl mx-auto prose prose-slate prose-xs text-xs md:text-sm text-[#475569] leading-relaxed space-y-6">
          
          <div>
            <h2 className="font-sans font-black text-slate-900 text-xl mb-3">Disposable email addresses</h2>
            <p>Nowadays, digital interactions are part of our everyday routine—signing up for newsletters, accessing online services, or downloading free resources—we constantly share our personal information, especially our email addresses. But what if there was a way to interact with websites without giving away your real inbox?</p>
            <p className="mt-2">That's where <strong className="text-slate-900">temporary email addresses</strong> are very helpful. Other popular names are <strong className="text-slate-900">disposable email</strong>, <strong className="text-slate-900">throwaway email</strong>, <strong className="text-slate-900">burner email</strong>, or <strong className="text-slate-900">fake email</strong>. These services allow you to instantly generate an email address that you can use for a short time and delete later. They are ideal for users who want to filter spam, improve their privacy, and stay secure.</p>
          </div>

          <div>
            <h3 className="font-sans font-black text-slate-900 text-md mb-2">Other names for temporary email</h3>
            <p>Temporary email services go by many names, each highlighting different aspects of their purpose:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-slate-900">Disposable email address (DEA)</strong> – emphasizes the fact that it's meant to be discarded after use.</li>
              <li><strong className="text-slate-900">Throwaway email</strong> – a common term indicating email that is used for one-time or short-term usage.</li>
              <li><strong className="text-slate-900">Burner email</strong> – a popular name among privacy enthusiasts, stands for a temporary email used for a specific task and then "burned" or deleted.</li>
              <li><strong className="text-slate-900">Fake email</strong> – often used when the goal is to quickly generate an address without verification.</li>
              <li><strong className="text-slate-900">Anonymous email</strong> – highlights the fact that your identity isn't related to the email address.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans font-black text-slate-900 text-md mb-2">Why use a temporary email address?</h3>
            <p>There are many reasons to use a temporary email. Maybe you're a casual user, maybe a developer, an apps tester, or someone who values online privacy — temp emails offer real benefits:</p>
            <div className="space-y-3.5 mt-2">
              <p><strong>1. Protect your primary inbox from spam</strong><br/>Most websites require an email to register, even if you only need their service once. Sadly, many of these websites share or sell email data to third parties. Over time, this clutters your inbox with unwanted offers, newsletters, and even phishing attempts. With a disposable email, you can register, verify, and move on—leaving your main inbox untouched.</p>
              <p><strong>2. Stay anonymous and protect your identity</strong><br/>Whenever you share your personal email, you also risk exposing your identity, especially if it's tied to your name or personal data. Temporary email addresses allow you to operate online without revealing who you are. This is very useful for accessing content behind email walls, signing up for forums, or contacting people on marketplaces.</p>
              <p><strong>3. Test apps and websites without commitment</strong><br/>If you're a developer or QA tester, you often need to test email functionality. Use temporary email addresses for this: sign up and test account creation, verification links, and transactional emails — without using a real address, cluttering your personal inbox, or managing multiple test accounts manually.</p>
            </div>
          </div>

        </div>

        {/* 8. "Discover more" rounded buttons card (Screenshot 5) */}
        <div className="mt-14 max-w-2xl mx-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-3 font-sans select-none">
            Discover more
          </span>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
            
            <div className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group">
              <span className="text-xs md:text-sm text-slate-700 font-bold group-hover:text-indigo-600 transition-colors">
                Digital Identity Protection Guide
              </span>
              <span className="text-slate-400 select-none">→</span>
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group">
              <span className="text-xs md:text-sm text-slate-700 font-bold group-hover:text-indigo-600 transition-colors">
                Temporary Email Blog Releases
              </span>
              <span className="text-slate-400 select-none">→</span>
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group">
              <span className="text-xs md:text-sm text-slate-700 font-bold group-hover:text-indigo-600 transition-colors">
                Disposable Email App Integration Specs
              </span>
              <span className="text-slate-400 select-none">→</span>
            </div>

          </div>
        </div>

      </main>

      {/* 9. Columns footer block matching screenshots 5/6 */}
      <footer className="border-t border-slate-200 bg-[#f8fafc] pt-14 pb-10 mt-20 font-sans">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Columns Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs mb-10 pb-10 border-b border-slate-200/80">
            
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Features</h4>
              <ul className="space-y-2 text-slate-500">
                <li className="hover:text-slate-800 cursor-pointer">API</li>
                <li className="hover:text-slate-800 cursor-pointer">Custom Domains</li>
                <li className="hover:text-slate-800 cursor-pointer">10 Minute Mail</li>
                <li className="hover:text-slate-800 cursor-pointer">Email Forwarding</li>
                <li className="hover:text-slate-800 cursor-pointer">Telegram Bot</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Links</h4>
              <ul className="space-y-2 text-slate-500">
                <li className="hover:text-slate-800 cursor-pointer">Blog</li>
                <li onClick={() => document.getElementById('how-to-use-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#00a2ff] cursor-pointer font-bold text-[#00a2ff]">Help</li>
                <li className="hover:text-slate-800 cursor-pointer">Apps</li>
                <li className="hover:text-slate-800 cursor-pointer">Extensions</li>
                <li className="hover:text-slate-800 cursor-pointer">Donate</li>
                <li className="hover:text-slate-800 cursor-pointer">GitHub</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Free Tools</h4>
              <ul className="space-y-2 text-slate-500">
                <li className="hover:text-slate-800 cursor-pointer">Password Generator</li>
                <li className="hover:text-slate-800 cursor-pointer">Data Breach Checker</li>
                <li className="hover:text-slate-800 cursor-pointer">Email Validator</li>
                <li className="hover:text-slate-800 cursor-pointer">Spam Checker</li>
                <li className="hover:text-slate-800 cursor-pointer font-bold text-indigo-600">Free Email Aliases</li>
                <li className="hover:text-slate-800 cursor-pointer">Gmail Aliases Extension</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Company</h4>
              <ul className="space-y-2 text-slate-500">
                <li className="hover:text-slate-800 cursor-pointer">Contact Us</li>
                <li onClick={() => setActiveLegalModal('privacy')} className="hover:text-[#00a2ff] font-bold text-indigo-600 cursor-pointer select-none">Privacy Policy</li>
                <li onClick={() => setActiveLegalModal('terms')} className="hover:text-[#00a2ff] font-bold text-indigo-600 cursor-pointer select-none">Terms of Service</li>
              </ul>
            </div>

          </div>

          {/* Footer branding row with Blue Logo, legal text, dropdown & app store logos */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-slate-400">
            
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-1.5 mb-1.5 justify-center md:justify-start">
                <div className="w-5 h-5 rounded-md bg-[#00a2ff] text-white flex items-center justify-center font-black text-xs select-none shadow-sm">t</div>
                <span className="font-bold text-xs text-slate-800 leading-none">temp-mail</span>
              </div>
              <p className="font-sans text-center md:text-left text-slate-600 font-bold">
                Free temporary emails © 2026 temp-mail.io. All rights reserved.
              </p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-sm text-center md:text-left leading-normal font-sans">
                Our secure memory-only, zero-log, and cookie-free infrastructure guarantees complete data protection and isolation under global privacy conventions. Featured on <strong className="text-slate-600">StartupFound</strong>. Safe sandbox for verification tests.
              </p>
            </div>

            {/* Language dropdown button */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-md font-bold tracking-wide transition-colors">
                <span>🌐 English</span>
                <span className="text-[9px] text-slate-400">▼</span>
              </button>
            </div>

          </div>

        </div>
      </footer>

      {/* 10. Legal Information Dialog Modals - Real custom content without mocks */}
      {activeLegalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden font-sans">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-sans font-extrabold text-[#111827] text-lg">
                {activeLegalModal === 'privacy' ? 'Privacy Policy – temp-mail' : 'Terms of Service – temp-mail'}
              </h3>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-205 text-slate-600 text-xs font-bold rounded-md"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
              {activeLegalModal === 'privacy' ? (
                <>
                  <p className="font-semibold text-slate-800">Effective Date: June 8, 2026</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">1. Zero-Log, Privacy-First Architecture</h4>
                  <p>Our disposable mail servers operate with strict memory-only structures. No personal records, real names, user billing information, or identity logs are collected, inspected, or saved. We do not catalog your original IP addresses or location signals.</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">2. Immediate Purge of Communications</h4>
                  <p>All transient incoming emails stored under temporary monikers belong strictly to you during their session. Emails reside in the local application buffer cache. If a mailbox remains inactive or if you click the discard/delete button, all data gets flushed immediately with zero retention.</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">3. Cookie-Free Experience</h4>
                  <p>This web application values physical transparency. We do not run third-party tracking networks, and we collect no cookies to trace you around other sites. Your customized preferences (like dark mode toggle or local active session monikers) are saved in your browser's private localStorage environment and never transmitted back to us.</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">4. Content Integrity</h4>
                  <p>Inboxes are secure sandbox components intended for development and layout checks. We do not scan the contents of emails unless required by severe compliance actions to restrict abuse.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-800">Effective Date: June 8, 2026</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">1. Usage Authorization</h4>
                  <p>This application provides free, on-demand temporary email addresses. Users are granted rights to access these temporary sandboxes exclusively for verifying account validations, reviewing newsletter layouts, testing transactional schemas, and insulating real addresses from marketing loops.</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">2. Abusive Conduct Prohibited</h4>
                  <p>You agree not to exploit this tool to engage in unlawful attempts, execute bulk automated registrations, send abusive outbound campaigns, circumvent legal locks, or impersonate other entities or real services. We implement strict server rules to identify and block aggressive API scraping attempts.</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">3. Disclaimers and Outward Traffic Limitation</h4>
                  <p>Our addresses are designed exclusively for incoming notifications. Standard sending is disabled to prevent outbound spam. Email boxes are transient; we provide zero warranties or performance guarantees regarding mailbox retention, speed logs, or absolute packet delivery.</p>
                  
                  <h4 className="font-bold text-slate-900 mt-4">4. Modifications to Service</h4>
                  <p>We reserves the absolute right to renew domains, block specific routing origins, or discontinue specific domains without notification to ensure system stability.</p>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-5 py-2 bg-[#00a2ff] hover:bg-[#008be0] text-white font-bold text-xs rounded-lg animate-pulse"
              >
                Acknowledge and Accept
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 11. Custom Invisible-by-default Debug Mailbox Simulator Controls floating FAB */}
      <button
        id="toggle-simulator-fab"
        onClick={() => setShowSimulator(!showSimulator)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 bg-[#00a2ff] hover:bg-[#008be0] text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-xs font-bold"
        title="Trigger simulated layout validations inside sandbox"
      >
        <span>🧪 SANDBOX TESTER</span>
      </button>

      {/* Simulator Overlays */}
      {showSimulator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 relative z-10 animate-scaleUp">
            
            {/* Modal Heading Control bar */}
            <div className="absolute right-4 top-4 z-20">
              <button
                id="close-simulator-btn"
                onClick={() => setShowSimulator(false)}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md transition-colors text-xs font-bold"
                title="Close"
              >
                ✕ Close
              </button>
            </div>

            {/* Injected Content */}
            <div className="max-h-[85vh] overflow-y-auto">
              <SimulatorPanel
                currentEmail={email}
                onSimulateReceive={handleSimulateReceive}
                hasGemini={hasGemini}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

