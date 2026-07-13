import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-brand-500',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500'
};

export function Button({
  variant = 'primary', className = '', children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`} {...props}>{children}</div>;
}

export function Input({ label, error, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <input
        className={`mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border ${error ? 'border-rose-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-600 mt-1 block">{error}</span>}
    </label>
  );
}

export function Textarea({ label, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <textarea
        className={`mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <select
        className={`mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border bg-white ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-slate-500">{title}</p>
      {hint && <p className="text-sm text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
