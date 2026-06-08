/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Terminal, MailOpen, Send, Loader2, Award, Zap, FileCode, Check } from 'lucide-react';

interface SimulatorPanelProps {
  currentEmail: string;
  onSimulateReceive: (scenario: string, options?: any) => Promise<boolean>;
  hasGemini: boolean;
}

export default function SimulatorPanel({
  currentEmail,
  onSimulateReceive,
  hasGemini
}: SimulatorPanelProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'ai'>('quick');
  const [isLoading, setIsLoading] = useState(false);
  const [successStatus, setSuccessStatus] = useState(false);
  
  // Custom inputs state
  const [customSender, setCustomSender] = useState('billing@stripe.com');
  const [customSubject, setCustomSubject] = useState('Payment Succeeded for Invoice #1823');
  const [customBody, setCustomBody] = useState(`
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #635bff;">Stripe Payments</h2>
      <p>Your payment of <strong>$15.00 USD</strong> has been successfully processed.</p>
      <div style="background: #f8f9fa; padding: 12px; margin: 15px 0; border-radius: 4px; font-family: monospace;">
        Invoice ID: INV-2026-992A<br/>
        Date: June 8, 2026
      </div>
      <p>Need support? Log in to your Stripe billing dashboard at any time.</p>
    </div>
  `);

  // AI Prompt inputs state
  const [aiPromptInput, setAiPromptInput] = useState('An official looking verification invoice from Stripe of $49.00 with a receipt and validation button');

  const triggerSimulation = async (scenario: string, data?: any) => {
    setIsLoading(true);
    setSuccessStatus(false);
    try {
      const ok = await onSimulateReceive(scenario, data);
      if (ok) {
        setSuccessStatus(true);
        setTimeout(() => setSuccessStatus(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSimulation('custom', { customSender, customSubject, customBody });
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    triggerSimulation('ai-custom', { aiPrompt: aiPromptInput });
  };

  const quickPresets = [
    { key: 'github', label: 'Mock OTP Verification Pass', desc: 'Simulate GitHub sign-up verification OTP layout block.', icon: '🔐' },
    { key: 'netflix', label: 'Mock Subscription Welcome Alert', desc: 'Simulate onboarding welcome sequence receipts and mail cards.', icon: '🍿' },
    { key: 'paypal', label: 'Mock Invoice Statement Design', desc: 'Simulate billing transaction updates and layout formats.', icon: '💸' },
    { key: 'spotify', label: 'Mock Account Restoration Link', desc: 'Simulate credentials recovery mail reset layout mechanics.', icon: '🎵' },
    { key: 'slack', label: 'Mock Collaboration Platform Pass', desc: 'Simulate workplace join invitation card formatting test.', icon: '💬' },
    { key: 'amazon', label: 'Mock Logistics Shipment Status', desc: 'Simulate order status tracker labels and delivery indicators.', icon: '📦' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-200">
      
      {/* Sidebar background graphics */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-[#00a2ff]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00a2ff]/10 flex items-center justify-center text-[#00a2ff]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              Developer Layouts Sandbox
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Test transactional styling and email validation compatibility</p>
          </div>
        </div>

        {successStatus && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-bounce">
            <Check className="w-3.5 h-3.5" /> SENT!
          </span>
        )}
      </div>

      {/* Tabs list selector */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
        <button
          id="tab-quick-preset"
          onClick={() => setActiveTab('quick')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors duration-150 ${
            activeTab === 'quick'
              ? 'border-[#00a2ff] text-[#00a2ff]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🎁 Quick Presets
        </button>
        <button
          id="tab-custom-form"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors duration-150 ${
            activeTab === 'custom'
              ? 'border-[#00a2ff] text-[#00a2ff]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🛠️ Custom Craft
        </button>
        <button
          id="tab-ai-generator"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors duration-150 flex items-center justify-center gap-1.5 ${
            activeTab === 'ai'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>AI Generator</span>
        </button>
      </div>

      {/* Panels body container */}
      <div className="p-5">
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-[#00a2ff] animate-spin" />
            <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
              {activeTab === 'ai' ? 'Invoking Gemini AI Agent...' : 'Seeding sandbox inbox...'}
            </p>
          </div>
        )}

        {/* Tab 1: Quick Simulator Presets */}
        {activeTab === 'quick' && (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-1">
              Verify your client and custom interface rendering formats by emitting simulated, locally-generated mock templates directly into the layout sandbox.
            </p>
            
            <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {quickPresets.map((preset) => (
                <button
                  id={`preset-${preset.key}-btn`}
                  key={preset.key}
                  disabled={isLoading}
                  onClick={() => triggerSimulation(preset.key)}
                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-950/60 dark:border-slate-800 dark:hover:border-slate-700/80 rounded-xl transition-all flex items-start gap-3 active:scale-98 group"
                >
                  <span className="text-xl select-none">{preset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#00a2ff] transition-colors">
                      {preset.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{preset.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#00a2ff] px-2 py-0.5 bg-[#00a2ff]/10 rounded-md">
                    PUSH
                  </span>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Tab 2: Custom crafted entry */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                From (Sender Email)
              </label>
              <input
                id="custom-sender-input"
                type="email"
                required
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                placeholder="e.g. support@netflix.com"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a2ff]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Subject Line
              </label>
              <input
                id="custom-subject-input"
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Verify your authorization code"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a2ff]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  HTML Body Content
                </label>
                <span className="text-[9px] font-mono text-indigo-500 px-1.5 bg-indigo-500/10 rounded flex items-center gap-1">
                  <FileCode className="w-2.5 h-2.5" /> HTML Allowed
                </span>
              </div>
              <textarea
                id="custom-body-input"
                rows={5}
                required
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="<p>Insert text here...</p>"
                className="w-full px-3 py-2.5 text-[11px] font-mono bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a2ff] leading-relaxed"
              />
            </div>

            <button
              id="deliver-custom-btn"
              type="submit"
              className="w-full py-3 bg-[#00a2ff] hover:bg-[#008be0] text-white rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-[#00a2ff]/10 transition-all active:scale-97"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Deliver Custom Entry</span>
            </button>

          </form>
        )}

        {/* Tab 3: AI generator with Gemini */}
        {activeTab === 'ai' && (
          <form onSubmit={handleAISubmit} className="space-y-4">
            
            <div className="bg-indigo-550/10 border border-indigo-500/15 p-4 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="font-bold">Gemini Smart Mail Drafts</span>
              </div>
              {!hasGemini ? (
                <span className="text-[10px] text-red-500 block font-medium">To test this flow, make sure to configure process.env.GEMINI_API_KEY inside the Secrets panel first. Static template deliveries are used as fallback.</span>
              ) : (
                <span>Describe ANY notification or onboarding mail you want to receives. Gemini builds the metadata, extracts simulated OTP codes, and writes a gorgeous inline-styled HTML design.</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Describe the email content/vibe
              </label>
              <textarea
                id="ai-prompt-input"
                rows={4}
                required
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                placeholder="A monthly report from HubSpot showing web traffic has spiked by 412%, styled as a modern sleek graph metrics email alert..."
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed focus:border-indigo-500"
              />
            </div>

            <button
              id="deliver-ai-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 transition-all active:scale-97 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate & Deliver</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
