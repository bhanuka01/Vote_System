import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-600 mb-6">
        The requested page does not exist or may have moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
