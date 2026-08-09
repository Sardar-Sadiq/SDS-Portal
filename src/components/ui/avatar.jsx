import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl font-bold"
  };

  const getInitials = (n) => {
    return (n || 'User')
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={twMerge(clsx("relative inline-flex items-center justify-center rounded-full overflow-hidden bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold ring-2 ring-neutral-200 dark:ring-neutral-800 shrink-0", sizes[size], className))}>
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-semibold select-none">{getInitials(name)}</span>
      )}
    </div>
  );
};
