'use client';

import { useState } from 'react';

interface ContactFormProps {
  username: string;
  apiUrl: string;
}

export default function ContactForm({ username, apiUrl }: ContactFormProps) {
  const [contactForm, setContactForm] = useState({
    sender_name: '',
    sender_email: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    
    try {
      const response = await fetch(`${apiUrl}/portfolio/public/${username}/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      setSent(true);
      setContactForm({ sender_name: '', sender_email: '', subject: '', message: '' });
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center p-8 rounded-2xl bg-green-500/10 border border-green-500/20">
        <p className="text-green-400 text-xl">✓ Message sent successfully!</p>
        <p className="text-on-surface-secondary mt-2">I&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleContact} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-2">Name</label>
          <input
            type="text"
            required
            value={contactForm.sender_name}
            onChange={(e) => setContactForm({ ...contactForm, sender_name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-surface-tertiary border border-outline-secondary text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none focus:border-purple-500"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-2">Email</label>
          <input
            type="email"
            required
            value={contactForm.sender_email}
            onChange={(e) => setContactForm({ ...contactForm, sender_email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-surface-tertiary border border-outline-secondary text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none focus:border-purple-500"
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-on-surface-secondary mb-2">Subject</label>
        <input
          type="text"
          required
          value={contactForm.subject}
          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-surface-tertiary border border-outline-secondary text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none focus:border-purple-500"
          placeholder="What's this about?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-on-surface-secondary mb-2">Message</label>
        <textarea
          required
          rows={5}
          value={contactForm.message}
          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-surface-tertiary border border-outline-secondary text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none focus:border-purple-500 resize-none"
          placeholder="Your message..."
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
