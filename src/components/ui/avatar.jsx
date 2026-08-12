import React from 'react';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';

export const Avatar = ({
  src,
  style = 'bottts',
  seed,
  name = 'User',
  size = 'md',
  className = ''
}) => {
  return (
    <EmployeeAvatar
      src={src}
      style={style}
      seed={seed}
      name={name}
      size={size}
      className={className}
    />
  );
};
