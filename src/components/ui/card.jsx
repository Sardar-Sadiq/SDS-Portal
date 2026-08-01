import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className = '', doubleBezel = true, ...props }) => {
  if (doubleBezel) {
    return (
      <div className={twMerge("double-bezel", className)} {...props}>
        <div className="double-bezel-inner">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={twMerge("rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card text-card-foreground p-5 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={twMerge("flex flex-col space-y-1.5 pb-3 border-b border-neutral-100 dark:border-neutral-800/60 mb-4", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={twMerge("text-base font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={twMerge("text-xs text-neutral-500 dark:text-neutral-400 font-normal", className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={twMerge("pt-0", className)} {...props}>
    {children}
  </div>
);
