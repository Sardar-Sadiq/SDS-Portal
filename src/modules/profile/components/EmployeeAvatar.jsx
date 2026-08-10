import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function EmployeeAvatar({
  style = 'lorelei',
  seed,
  size = 40,
  className = '',
  src,
  name = 'Employee'
}) {
  const [imageError, setImageError] = useState(false);

  // Determine final avatar URL:
  // 1. If stored seed is present (or explicitly passed), use DiceBear SVG URL with style + seed
  // 2. Else if src is passed and it is a custom uploaded photo (not old static placeholders), use src
  // 3. Else fallback to DiceBear with name as seed
  let avatarUrl = '';

  if (seed) {
    avatarUrl = `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  } else if (src && !src.includes('ui-avatars.com') && !src.includes('unavatar.io')) {
    avatarUrl = src;
  } else {
    const fallbackSeed = name || 'Employee';
    avatarUrl = `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(fallbackSeed)}`;
  }

  // Preset size mapping for string props ('sm', 'md', 'lg', 'xl')
  const presetSizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl font-bold"
  };

  const isPresetSize = typeof size === 'string' && presetSizes[size];

  const getInitials = (n) => {
    return (n || 'User')
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeStyle = isPresetSize
    ? {}
    : { width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size };

  return (
    <div
      style={sizeStyle}
      className={twMerge(
        clsx(
          "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold ring-2 ring-neutral-200 dark:ring-neutral-800 shrink-0 select-none",
          isPresetSize ? presetSizes[size] : "",
          className
        )
      )}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={`${name}'s profile avatar`}
          onError={() => setImageError(true)}
          width={typeof size === 'number' ? size : undefined}
          height={typeof size === 'number' ? size : undefined}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <span className="font-semibold">{getInitials(name)}</span>
      )}
    </div>
  );
}
