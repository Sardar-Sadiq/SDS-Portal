import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProfileImageModal } from './ProfileImageModal';

export function EmployeeAvatar({
  size = 40,
  className = '',
  src,
  name = 'Employee',
  employee,
  onClick,
  enableModal = true
}) {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reset image error state whenever src or name changes
  React.useEffect(() => {
    setImageError(false);
  }, [src, name]);

  const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Employee')}&background=10b981&color=fff&bold=true`;
  
  // Determine target image URL
  const avatarUrl = src || uiAvatarUrl;

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

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (enableModal) {
      e.stopPropagation();
      setIsModalOpen(true);
    }
  };

  const activeEmployeeObj = employee || {
    name,
    full_name: name,
    card_image: avatarUrl,
    avatar: avatarUrl
  };

  return (
    <>
      <div
        style={sizeStyle}
        onClick={handleClick}
        title={`Click to view ${name}'s account card image`}
        className={twMerge(
          clsx(
            "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-emerald-600 text-white font-bold ring-2 ring-neutral-200 dark:ring-neutral-800 shrink-0 select-none",
            enableModal || onClick ? "cursor-pointer hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-150" : "",
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

      {enableModal && (
        <ProfileImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employee={activeEmployeeObj}
        />
      )}
    </>
  );
}


