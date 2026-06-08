/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQItem } from '../types';

const FAQS: FAQItem[] = [
  {
    question: "What is a temporary disposable email service?",
    answer: "A temporary disposable email service provides you with a transient, fully-functional email ID with zero registry requirements. It enables you to sign up for platforms, verify accounts, or fetch coupons securely without disclosing your real credentials, filtering out any future advertisement campaigns or spam operations before of time."
  },
  {
    question: "How does Temp Mail help defend my digital privacy?",
    answer: "Over 80% of websites and apps demand your personal email to grant trial access. These credentials are regularly cached, parsed, and traded with advertising networks. Utilizing a disposable temp mailbox forces any spam, malicious trackers, or promotional follow-ups to hit an empty transient vault instead of your personal inbox."
  },
  {
    question: "How long does my temporary email address last?",
    answer: "Your temporary email remains fully active as long as you keep your session open or store the custom ID in your browser. Unlike other platforms that wipe inboxes every 10 minutes, our custom implementation allows your address to remain viable indefinitely, unless you explicitly select 'Delete' or 'New address'."
  },
  {
    question: "Can I receive attachments and interactive emails?",
    answer: "Yes! Our high-fidelity simulation and template engines support fully interactive layout flows, including welcome images, OTP activation panels, inline CSS styling, download links, and confirmation code blocks, perfectly mirroring a true system environment."
  },
  {
    question: "Why should I use the Simulation Testing Console?",
    answer: "Since this Sandbox environment operates inside a sandboxed container, receiving external SMTP letters is disabled to prevent security vulnerabilities. Our built-in Simulation Console lets you fully interact with the mail environment by triggering instant account creations, security alerts, pricing logs, or creating custom entries - including custom AI-powered email generations matching your specific prompt!"
  }
];

export default function MailboxFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="faq-section" className="w-full max-w-4xl mx-auto mt-16 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00a2ff]/10 border border-[#00a2ff]/20 text-[#00a2ff] text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">
          <HelpCircle className="w-3 h-3" /> F.A.Q.
        </div>
        <h2 className="font-sans font-extrabold text-2xl md:text-3xl tracking-tight text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          Learn how to leverage a disposable mailbox to safeguard your online privacy.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
            >
              <button
                id={`faq-btn-${idx}`}
                onClick={() => toggleFAQ(idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors duration-150"
              >
                <span className="font-sans text-sm md:text-base">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 flex-shrink-0 ml-4 ${
                    isOpen ? 'rotate-180 text-[#00a2ff]' : ''
                  }`}
                />
              </button>
              
              <div
                className={`transition-all duration-200 ease-in-out overflow-hidden ${
                  isOpen ? 'max-h-[300px] border-t border-slate-100 dark:border-slate-800/50' : 'max-h-0'
                }`}
              >
                <p className="p-5 font-sans text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
