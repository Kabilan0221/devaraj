import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../utils/api';
import { Download, Phone, User, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface DownloadDetailsModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onSubmit: (name: string, mobile: string) => Promise<void> | void;
}

export const DownloadDetailsModal: React.FC<DownloadDetailsModalProps> = ({
  isOpen,
  title,
  description,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setRegisteredName(null);
  }, [isOpen]);

  // If the mobile number is already registered, show/fill the saved customer name.
  useEffect(() => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setRegisteredName(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLookupLoading(true);
        const res = await apiRequest<any>(`/api/customers/lookup?mobile=${cleanMobile}`);
        if (res?.found && res?.name) {
          setRegisteredName(res.name);
          setName(res.name);
        } else {
          setRegisteredName(null);
        }
      } catch {
        setRegisteredName(null);
      } finally {
        setLookupLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mobile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit(name.trim(), cleanMobile);
      setName('');
      setMobile('');
    } catch (err: any) {
      setError(err?.message || 'Unable to save your details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-amber-700 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Download className="w-4 h-4" />
              Download
            </div>
            <h3 className="text-lg font-black mt-1">{title}</h3>
            <p className="text-xs text-red-100 mt-1">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Your name and mobile number are saved securely so the Admin Panel can recognize returning customers.</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Customer Name / பெயர் *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-amber-600" />
              <input
                ref={nameInputRef}
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    mobileInputRef.current?.focus();
                  }
                }}
                placeholder="Enter your name"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-gray-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 ${registeredName ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300'}`}
              />
              {registeredName && <div className="mt-1 text-[10px] font-bold text-emerald-700">✓ Registered customer: {registeredName}</div>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Mobile Number / மொபைல் *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
              <input
                ref={mobileInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
                  }
                }}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              {lookupLoading && <div className="mt-1 text-[10px] text-amber-700 font-bold">Checking registered customer...</div>}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-sm shadow-md disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : 'Save & Download'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
