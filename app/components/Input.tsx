'use client';
import { forwardRef } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  invert?: boolean; // For the inverted final-CTA section (white bg)
};

/**
 * Bold Typography input: sharp corners, transparent-input bg, 1px border,
 * 16px text (prevents iOS zoom), focus shifts border to accent. No ring.
 */
const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = '', invert = false, ...rest },
  ref,
) {
  const base = [
    'block w-full h-12 md:h-14 px-4 text-base font-sans',
    'transition-colors duration-150 ease-crisp',
    'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    'rounded-none',
  ].join(' ');

  const palette = invert
    ? [
        'bg-transparent text-background',
        'border border-background/30 placeholder:text-background/50',
        'focus:border-accent',
      ].join(' ')
    : [
        'bg-input text-foreground',
        'border border-border placeholder:text-muted-foreground',
        'focus:border-accent',
      ].join(' ');

  return (
    <input
      ref={ref}
      className={`${base} ${palette} ${className}`}
      {...rest}
    />
  );
});

export default Input;
