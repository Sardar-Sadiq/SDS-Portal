import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl font-bold"
  };

  const getInitials = (n) => {
    return n
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={twMerge(clsx("relative inline-flex items-center justify-center rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 ring-2 ring-neutral-200 dark:ring-neutral-800 shrink-0", sizes[size], className))}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold">{getInitials(name)}</span>
      )}
    </div>
  );
};
