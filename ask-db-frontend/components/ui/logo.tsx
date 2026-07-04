'use client';

export function AskDBLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
        <span className="text-white font-bold text-lg">⚡</span>
      </div>
      <span className="font-bold text-lg tracking-tight">AskDB</span>
    </div>
  );
}
