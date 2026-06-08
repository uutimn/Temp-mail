/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { EmailMessage } from "./src/types.js";

// Initialize Gemini SDK if API Key exists
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for temporary mailboxes
// Keyed by email address -> list of EmailMessages
const mailboxes: Record<string, EmailMessage[]> = {};
const mailboxMeta: Record<string, { createdAt: string; lastChecked: string }> = {};

const DOMAINS = [
  "tempmail.io",
  "dispostable.com",
  "inboxflow.net",
  "securesend.id",
  "devmail.tech"
];

// Generates a random standard username
function generateRandomUsername(): string {
  const adjectives = [
    "swift", "silent", "bright", "quantum", "polar", "shadow", "cyber", "cosmic",
    "vortex", "stellar", "alpha", "nova", "delta", "nebula", "cryptic", "hyper"
  ];
  const nouns = [
    "wolf", "fox", "hawk", "rover", "pilot", "pixel", "byte", "falcon", "orbit",
    "wave", "node", "pulse", "matrix", "nexus", "echo", "spark", "grid", "gate"
  ];
  const number = Math.floor(1000 + Math.random() * 9000);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}.${noun}${number}`;
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// System Template Generator as a fail-safe
const STATIC_TEMPLATES: Record<string, (recipient: string, customCode?: string) => Partial<EmailMessage>> = {
  welcome: (recipient) => ({
    sender: "support@temp-mail.io",
    senderName: "Temp Mail Support",
    subject: "Welcome to your temporary mailbox! ✉️",
    category: "primary",
    avatar: "TM",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px;">✉️</span>
          <h2 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 12px; margin-bottom: 4px;">Welcome to Temp Mail</h2>
          <p style="font-size: 14px; color: #64748b;">Your secure disposable inbox is active</p>
        </div>
        <div style="line-height: 1.6; font-size: 15px; color: #334155;">
          <p>Hello,</p>
          <p>This is a simulated verification/onboarding mail to show that your inbox is fully operational and ready to fetch emails in real-time.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Active temporary address:</strong>
            <code style="font-family: ui-monospace, monospace; font-size: 14px; color: #2563eb; background-color: #eff6ff; padding: 2px 6px; border-radius: 4px;">${recipient}</code>
          </div>
          <p><strong>Core Features at a glance:</strong></p>
          <ul style="padding-left: 20px; margin-bottom: 20px;">
            <li style="margin-bottom: 8px;">🔄 <strong>Instant Update</strong>: Checking for incoming messages is optimized to seconds.</li>
            <li style="margin-bottom: 8px;">✏️ <strong>Custom Names</strong>: Tap 'Change email' to create a custom moniker or switch domains.</li>
            <li style="margin-bottom: 8px;">🛠️ <strong>Simulation Dashboard</strong>: Trigger account activations on demand for testing.</li>
          </ul>
          <p>Thank you for choosing Temp Mail!</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This inbox is transient and secure. All metadata is stored exclusively in session memory.</p>
      </div>
    `
  }),
  github: (recipient, code) => {
    const otp = code || Math.floor(100000 + Math.random() * 900000).toString();
    return {
      sender: "noreply@github.com",
      senderName: "GitHub Secure",
      subject: `[GitHub] Verification code: ${otp}`,
      category: "security",
      otpCode: otp,
      avatar: "GH",
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 6px; background-color: #ffffff; color: #24292e; padding: 32px;">
          <div style="margin-bottom: 24px;">
            <svg height="32" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #24292e;">Verify your email address</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #586069; margin-bottom: 20px;">
            Please use the following verification code to complete your registration or access authority on GitHub.
          </p>
          <div style="background-color: #f6f8fa; border: 1px solid #eaecef; border-radius: 4px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: ui-monospace, monospace; font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #0366d6;">${otp}</span>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #586069; margin-bottom: 16px;">
            This validation code is transient and will expire in 10 minutes. If you did not request this verification, you can securely ignore this message.
          </p>
          <hr style="border: 0; border-top: 1px solid #eaecef; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6a737d;">GitHub, Inc. • 88 Colin P. Kelly Jr Street • San Francisco, CA 94107</p>
        </div>
      `
    };
  },
  netflix: (recipient) => ({
    sender: "info@netflix.com",
    senderName: "Netflix",
    subject: "Welcome to Netflix, friend! Let's get viewing 🎥",
    category: "primary",
    avatar: "NF",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #141414; color: #ffffff; padding: 40px; border-radius: 8px;">
        <div style="margin-bottom: 30px; text-align: center;">
          <h1 style="color: #E50914; font-size: 38px; font-weight: 900; letter-spacing: -1px; margin: 0;">NETFLIX</h1>
        </div>
        <div style="line-height: 1.6; font-size: 15px; color: #e5e5e5;">
          <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 16px;">Your subscription is ready to use</h2>
          <p>Hi there,</p>
          <p>Thank you for activating your subscription with <strong>${recipient}</strong>. You've unlocked unlimited access to thousands of blockbuster movies, award-winning series, original documentaries, and animation.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="#welcome" style="background-color: #E50914; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: 600; border-radius: 4px; display: inline-block;">Finish Profile Setup</a>
          </div>
          
          <p>If you have any questions, our support center is standing ready 24/7 to configure your smart devices, TVs, or laptops.</p>
          <p>Let's watch!</p>
          <p style="font-style: italic; color: #aaa;">– The Netflix Crew</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #333333; margin: 30px 0;" />
        <p style="font-size: 11px; color: #666666; text-align: center; line-height: 1.4;">
          This is a simulated message representing Netflix service layout. Deliveries are fictitious for testing on Temp Mail.
        </p>
      </div>
    `
  }),
  paypal: (recipient, code) => {
    const amt = code || (30 + Math.floor(Math.random() * 150)).toFixed(2);
    return {
      sender: "service@paypal.com",
      senderName: "PayPal Protection",
      subject: `Receipt for your transaction - $${amt} USD`,
      category: "billing",
      avatar: "PP",
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff; color: #1e293b; padding: 32px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h1 style="color: #003087; font-size: 24px; font-weight: 800; italic: true; margin: 0;">PayPal</h1>
            <span style="font-size: 12px; color: #64748b;">June 8, 2026</span>
          </div>
          <p style="font-size: 15px;">Hello customer,</p>
          <p style="font-size: 15px; line-height: 1.5;">You sent a payment of <strong>$${amt} USD</strong> to <strong>Aistudio Sandbox Stores</strong> (sandbox-payments@aistudio.local).</p>
          
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; background-color: #f8fafc; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 14px; color: #64748b; padding-bottom: 8px;">Transaction ID</td>
                <td style="font-size: 14px; font-family: monospace; text-align: right; font-weight: 600; padding-bottom: 8px;">TXN-${generateId().substring(0, 10).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #64748b; padding-bottom: 8px;">Charged To</td>
                <td style="font-size: 14px; text-align: right; padding-bottom: 8px;">${recipient}</td>
              </tr>
              <tr style="border-top: 1px solid #cbd5e1;">
                <td style="font-size: 16px; font-weight: 700; padding-top: 12px;">Total Paid</td>
                <td style="font-size: 16px; font-weight: 700; color: #1e293b; text-align: right; padding-top: 12px;">$${amt} USD</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">It might take a few moments for this transaction to manifest in your account ledger. We secure all purchases with standard PayPal Buyer Safeguard Protection.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">PayPal Dev Sandbox Engine • San Jose, CA</p>
        </div>
      `
    };
  },
  spotify: (recipient, code) => {
    const otp = code || Math.floor(1000 + Math.random() * 9000).toString();
    return {
      sender: "no-reply@spotify.com",
      senderName: "Spotify Accounts",
      subject: `Your Spotify reset authorization: ${otp}`,
      category: "security",
      otpCode: otp,
      avatar: "SP",
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; border-radius: 12px; background-color: #000000; color: #ffffff; padding: 40px; text-align: center;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 36px; color: #1DB954;">🎵</span>
            <h2 style="font-size: 24px; font-weight: 700; color: #ffffff; margin-top: 12px;">Reset your password?</h2>
          </div>
          <p style="font-size: 14px; color: #b3b3b3; line-height: 1.6; margin-bottom: 30px;">
            We received a request to change the account password linked with <strong>${recipient}</strong>. Use the authorization code below to secure your credentials.
          </p>
          <div style="background-color: #121212; border: 2px solid #1DB954; display: inline-block; padding: 12px 36px; border-radius: 8px; font-size: 32px; font-family: monospace; font-weight: 800; letter-spacing: 6px; color: #1DB954; margin-bottom: 30px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #b3b3b3; margin-bottom: 24px;">
            If you did not request a password change, please ignore this warning. Keep this code secret.
          </p>
          <hr style="border: 0; border-top: 1px solid #282828; margin: 30px 0;" />
          <p style="font-size: 10px; color: #7f7f7f;">Spotify Sweden AB • Regeringsgatan 19 • Stockholm • Sweden</p>
        </div>
      `
    };
  },
  slack: (recipient) => ({
    sender: "no-reply@slack.com",
    senderName: "Slack",
    subject: "Invite: Join dev-workspace.slack.com on Slack 💬",
    category: "social",
    avatar: "SL",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1d1c1d; padding: 32px;">
        <div style="margin-bottom: 24px;">
          <h1 style="color: #4a154b; font-size: 28px; font-weight: 900; margin: 0;">Slack</h1>
        </div>
        <p style="font-size: 16px; font-weight: 700; color: #1d1c1d; margin-top: 0;">You've been invited to join Slack!</p>
        <p style="font-size: 15px; line-height: 1.5; color: #454245;">
          A team member is launching a workspace called <strong>dev-workspace</strong> and has extended an invitation for you directly at <strong>${recipient}</strong>.
        </p>
        
        <div style="margin: 28px 0;">
          <a href="#slack-join" style="background-color: #007a5a; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 700; border-radius: 4px; display: inline-block; text-align: center;">Join Workspace Now</a>
        </div>
        
        <p style="font-size: 13px; color: #616061; line-height: 1.5;">
          Let's collaborate! Slack brings teamwork, documents, channels, and conversations together inside a beautifully integrated workspace.
        </p>
        <hr style="border: 0; border-top: 1px solid #f2f2f2; margin: 28px 0;" />
        <p style="font-size: 11px; color: #a3a3a3; text-align: center;">Slack Technologies, LLC • Salesforce Tower • San Francisco, CA</p>
      </div>
    `
  }),
  amazon: (recipient) => ({
    sender: "shipment-tracking@amazon.com",
    senderName: "Amazon Prime Status",
    subject: "Package Delivered: Your Amazon order has arrived! 📦",
    category: "primary",
    avatar: "AZ",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #eaeded; background-color: #ffffff; color: #111111;">
        <div style="background-color: #232f3e; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #ff9900; font-size: 24px; font-weight: 800; font-style: italic;">amazon</span>
          <span style="color: #ffffff; font-size: 13px;">Prime Shipping</span>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; color: #c45500; font-weight: 600; margin-top: 0; margin-bottom: 4px;">Delivered today!</h2>
          <p style="font-size: 13px; color: #555555; margin-bottom: 24px;">Your package was dropped off at the front receptionist or parcel bin.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #eaeded;">
              <td style="padding: 12px 0; color: #555555; width: 30%;">Ship To</td>
              <td style="padding: 12px 0; font-weight: 600;">Temp-Mail Receiver (${recipient})</td>
            </tr>
            <tr style="border-bottom: 1px solid #eaeded;">
              <td style="padding: 12px 0; color: #555555;">Order ID</td>
              <td style="padding: 12px 0; font-weight: 600; font-family: monospace;">114-883726-1049281</td>
            </tr>
            <tr style="border-bottom: 1px solid #eaeded;">
              <td style="padding: 12px 0; color: #555555;">Delivered Items</td>
              <td style="padding: 12px 0; font-weight: 600;">1x Dev Sandbox Tools Setup Pack</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#amazon-track" style="background-color: #f0c14b; border: 1px solid #a88734; color: #111111; text-decoration: none; padding: 10px 24px; font-size: 14px; border-radius: 3px; display: inline-block; font-weight: 500;">Track your Package</a>
          </div>
          
          <p style="font-size: 12px; color: #555555; line-height: 1.5;">We hope you enjoy your sandbox simulator. Thank you for shopping with Amazon Prime!</p>
        </div>
        <div style="background-color: #f3f3f3; padding: 20px; font-size: 11px; text-align: center; color: #666666;">
          Amazon.com, 410 Terry Avenue N., Seattle, WA 98109-5210
        </div>
      </div>
    `
  })
};

// Seed initial email
function deliverEmailToInbox(email: string, templateKey: string, customCode?: string, minutesAgo: number = 0) {
  if (!mailboxes[email]) {
    mailboxes[email] = [];
  }
  
  const templateFn = STATIC_TEMPLATES[templateKey] || STATIC_TEMPLATES.welcome;
  const draft = templateFn(email, customCode);
  
  const date = new Date();
  if (minutesAgo > 0) {
    date.setMinutes(date.getMinutes() - minutesAgo);
  }
  
  const newMessage: EmailMessage = {
    id: generateId(),
    sender: draft.sender || "systems@temp-mail.io",
    senderName: draft.senderName || "System Auto",
    recipient: email,
    subject: draft.subject || "Incoming test message",
    body: draft.body || "<p>Direct receipt message</p>",
    category: draft.category || "primary",
    avatar: draft.avatar || "SYS",
    receivedAt: date.toISOString(),
    read: false,
    otpCode: draft.otpCode || null
  };
  
  mailboxes[email].unshift(newMessage);
  return newMessage;
}

// Seed beautiful initial usage emails so the inbox is not bare and demonstrates the categorizations instantly
function seedMailbox(email: string) {
  mailboxes[email] = [];
  deliverEmailToInbox(email, "welcome", undefined, 12);
  deliverEmailToInbox(email, "slack", undefined, 8);
  deliverEmailToInbox(email, "github", "704381", 4);
  deliverEmailToInbox(email, "netflix", undefined, 1);
}

// REST GET /api/mailbox
app.get("/api/mailbox", (req, res) => {
  let email = req.query.email as string;
  
  if (email && email.includes("@")) {
    const domainPart = email.split("@")[1];
    if (!DOMAINS.includes(domainPart)) {
      email = ""; // Reject invalid domain mailboxes
    }
  } else {
    email = "";
  }
  
  // If no email exists, initialize we randomize one
  if (!email) {
    const username = generateRandomUsername();
    const domain = DOMAINS[0];
    email = `${username}@${domain}`;
  }
  
  // Check in-memory store
  if (!mailboxes[email]) {
    mailboxes[email] = [];
    mailboxMeta[email] = {
      createdAt: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    };
    
    // Seed and deliver the initial usage emails after initializing
    seedMailbox(email);
  } else {
    mailboxMeta[email].lastChecked = new Date().toISOString();
  }
  
  res.json({
    email,
    created: mailboxMeta[email].createdAt,
    emails: mailboxes[email]
  });
});

// REST POST /api/mailbox/change
app.post("/api/mailbox/change", (req, res) => {
  const { username, domain } = req.body;
  
  if (!username || !domain) {
    return res.status(400).json({ error: "Username and domain parameters are necessary" });
  }
  
  // Clean special characters
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (!cleanUsername) {
    return res.status(400).json({ error: "Invalid username pattern" });
  }
  
  if (!DOMAINS.includes(domain)) {
    return res.status(400).json({ error: "Unrecognized or disabled domain selected" });
  }
  
  const newEmail = `${cleanUsername}@${domain}`;
  
  // Create mailbox if not existent
  if (!mailboxes[newEmail]) {
    mailboxes[newEmail] = [];
    mailboxMeta[newEmail] = {
      createdAt: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    };
    seedMailbox(newEmail);
  }
  
  res.json({
    email: newEmail,
    created: mailboxMeta[newEmail].createdAt,
    emails: mailboxes[newEmail]
  });
});

// REST POST /api/mailbox/delete
app.post("/api/mailbox/delete", (req, res) => {
  const { email } = req.body;
  if (email && mailboxes[email]) {
    delete mailboxes[email];
    delete mailboxMeta[email];
  }
  
  // Allocate a fresh random email instantly
  const username = generateRandomUsername();
  const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  const newEmail = `${username}@${domain}`;
  
  mailboxes[newEmail] = [];
  mailboxMeta[newEmail] = {
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString()
  };
  seedMailbox(newEmail);
  
  res.json({
    email: newEmail,
    created: mailboxMeta[newEmail].createdAt,
    emails: mailboxes[newEmail]
  });
});

// REST POST /api/mailbox/simulate-receive
app.post("/api/mailbox/simulate-receive", async (req, res) => {
  const { email, scenario, customSender, customSubject, customBody } = req.body;
  
  if (!email || !mailboxes[email]) {
    return res.status(400).json({ error: "No active mailbox matches this address." });
  }
  
  if (scenario === "custom") {
    const sender = customSender || "developer@tester.local";
    const senderName = sender.split("@")[0].toUpperCase();
    const subject = customSubject || "Developer Custom Mail Sandbox";
    const body = customBody || "<p>Hey friend! This is a simple test email.</p>";
    
    // Check if OTP is in the custom code or body to extract
    let otpCode: string | null = null;
    const otpMatch = body.match(/\b\d{4,6}\b/);
    if (otpMatch) {
      otpCode = otpMatch[0];
    }
    
    const customMessage: EmailMessage = {
      id: generateId(),
      sender,
      senderName,
      recipient: email,
      subject,
      body,
      category: "custom",
      avatar: senderName.substring(0, 2),
      receivedAt: new Date().toISOString(),
      read: false,
      otpCode
    };
    
    mailboxes[email].unshift(customMessage);
    return res.json({ success: true, email: customMessage });
  }
  
  // AI-custom with Gemini API if available and requested
  if (scenario === "ai-custom" && ai) {
    const { aiPrompt } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a realistic simulation email that matches this prompt request: "${aiPrompt || 'A notification subscription alert'}".
        The recipient email of this simulated invoice is "${email}". This needs to be extremely professional, styled cleanly inside standard standalone HTML tags without any external fonts but structured like an official email.
        Return the generated result in complete standalone JSON structure. Use this exact schema:
        {
          "sender": "The exact sender email matching the context",
          "senderName": "The official sender name",
          "subject": "The email subject line",
          "body": "The clean visual inline-styled HTML body containing verification boxes, nice colors, bullet lists, or relevant information",
          "category": "One of: security, primary, social, billing",
          "otpCode": "A 4-6 digit numeric OTP if relevant or null"
        }
        Only output the valid parsable JSON. No markdown wrappers.`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const resText = response.text || "";
      const parsed = JSON.parse(resText.trim());
      
      const generatedMessage: EmailMessage = {
        id: generateId(),
        sender: parsed.sender || "notification@ai-engine.local",
        senderName: parsed.senderName || "AI Simulation System",
        recipient: email,
        subject: parsed.subject || "Processed simulation email",
        body: parsed.body || `<div style="padding: 24px; font-family: sans-serif;">Generated prompt: ${aiPrompt}</div>`,
        category: (parsed.category || "primary") as any,
        avatar: (parsed.senderName || "AI").substring(0, 2).toUpperCase(),
        receivedAt: new Date().toISOString(),
        read: false,
        otpCode: parsed.otpCode || null
      };
      
      mailboxes[email].unshift(generatedMessage);
      return res.json({ success: true, email: generatedMessage });
    } catch (err: any) {
      console.error("AI Generation issue:", err);
      // Fallback if AI fails parsing or responding
      const fallback = deliverEmailToInbox(email, "welcome", "AI-FAIL");
      return res.json({ success: true, email: fallback, note: "Fallback used due to AI prompt processing error." });
    }
  }
  
  // Normal predefined templates
  const message = deliverEmailToInbox(email, scenario);
  res.json({ success: true, email: message });
});

// REST POST /api/mailbox/read
app.post("/api/mailbox/read", (req, res) => {
  const { email, id } = req.body;
  if (email && id && mailboxes[email]) {
    const msg = mailboxes[email].find(m => m.id === id);
    if (msg) {
      msg.read = true;
    }
  }
  res.json({ success: true });
});

// REST POST /api/mailbox/clear-all
app.post("/api/mailbox/clear-all", (req, res) => {
  const { email } = req.body;
  if (email && mailboxes[email]) {
    mailboxes[email] = [];
  }
  res.json({ success: true });
});

// Server-side environment details for client
app.get("/api/config", (req, res) => {
  res.json({
    hasGemini: !!ai,
    domains: DOMAINS
  });
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully. Port is ${PORT}.`);
  });
}

startServer();
