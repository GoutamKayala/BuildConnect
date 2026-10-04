import React, { useState } from 'react';
import { User } from 'lucide-react';

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base font-bold',
  xl: 'w-20 h-20 text-xl font-bold',
  '2xl': 'w-28 h-28 text-2xl font-bold',
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar = ({
  src,
  name = '',
  alt = '',
  size = 'md',
  className = '',
  iconClassName = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(name);
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // If valid image provided and has not errored, render img
  if (src && src.trim() && !imgError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover border border-slate-200 shadow-xs flex-shrink-0 ${className}`}
      />
    );
  }

  // Modern default avatar placeholder with initials or silhouette icon (NO random stock image)
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold tracking-wider border border-slate-300/40 shadow-xs flex-shrink-0 select-none ${className}`}
      title={name || 'Profile'}
      aria-label={name || 'Profile'}
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <User className={`w-1/2 h-1/2 text-slate-200 ${iconClassName}`} />
      )}
    </div>
  );
};
