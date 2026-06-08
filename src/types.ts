/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EmailMessage {
  id: string;
  sender: string;
  senderName: string;
  recipient: string;
  subject: string;
  body: string;
  bodyText?: string;
  receivedAt: string;
  read: boolean;
  avatar?: string;
  category: 'security' | 'primary' | 'social' | 'billing' | 'custom';
  otpCode?: string | null;
}

export interface MailboxSession {
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
