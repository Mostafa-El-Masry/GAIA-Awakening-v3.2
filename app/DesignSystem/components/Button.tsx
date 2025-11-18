'use client';

import React from 'react';
import { useDesign } from '../context/DesignProvider';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  size?: 'sm' | 'md';
};

export default function Button({ className = '', size = 'md', children, ...rest }: Props) {
  const { button, theme } = useDesign();

  const base = 'inline-flex items-center justify-center rounded-md transition focus:outline-none gaia-focus';
  const sizing = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  let style = '';

  if (button === 'solid') {
    style = 'gaia-contrast';
  } else if (button === 'outline') {
    style = 'border gaia-border gaia-hover-soft';
  } else { // ghost
    style = 'gaia-hover-soft';
  }

  return (
    <button className={`${base} ${sizing} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}
