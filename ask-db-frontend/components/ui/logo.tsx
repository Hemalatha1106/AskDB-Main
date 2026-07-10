'use client';

export function AskDBLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Light Theme Logo */}
      <img
        src="/AskDB-Logo-Light.png?v=3"
        alt="AskDB Logo"
        className="h-7 w-auto block dark:hidden object-contain"
      />
      {/* Dark Theme Logo */}
      <img
        src="/AskDB-Logo-Dark.png?v=3"
        alt="AskDB Logo"
        className="h-7 w-auto hidden dark:block object-contain"
      />
    </div>
  );
}

