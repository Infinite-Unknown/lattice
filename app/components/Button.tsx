'use client';
import Link from 'next/link';
import { forwardRef } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'py-2 px-0 text-xs gap-2',
  md: 'py-3 px-0 text-sm gap-2.5',
  lg: 'py-4 px-0 text-base gap-3',
};
const SIZE_OUTLINE_PADDING: Record<Size, string> = {
  sm: 'py-2 px-4 text-xs',
  md: 'py-3 px-6 text-sm',
  lg: 'py-4 px-8 text-base',
};

const BASE =
  'inline-flex items-center whitespace-nowrap font-semibold uppercase tracking-wider ' +
  'transition-all duration-150 ease-crisp focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px select-none';

/**
 * Primary variant: text-only with animated underline.
 * - Underline base scale-x-100, hover scale-x-110.
 * - Accent color, no background fill.
 * - Used everywhere a filled CTA used to live.
 *
 * Outline: 1px foreground border, inverts to filled on hover.
 *
 * Ghost: muted text, underline draws in on hover (scale-x-0 → 1).
 */
function classesFor(variant: Variant, size: Size): string {
  if (variant === 'outline') {
    return [
      BASE,
      SIZE_OUTLINE_PADDING[size],
      'border border-foreground text-foreground bg-transparent',
      'hover:bg-foreground hover:text-background',
    ].join(' ');
  }
  if (variant === 'ghost') {
    return [
      BASE,
      'py-2 px-4 text-sm',
      'text-muted-foreground hover:text-foreground',
      'underline-grow-trigger relative',
    ].join(' ');
  }
  // primary
  return [
    BASE,
    SIZE_CLASSES[size],
    'text-accent bg-transparent relative',
  ].join(' ');
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: 'button';
  href?: never;
};
type ButtonAsLink = CommonProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  as: 'link';
  href: string;
};
type Props = ButtonAsButton | ButtonAsLink;

const Button = forwardRef<HTMLElement, Props>(function Button(props, ref) {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props as any;
  const classes = `${classesFor(variant, size)} ${className}`;

  // For primary variant, attach the underline span as a child so it scales
  // from the start of the word horizontally.
  const inner =
    variant === 'primary' ? (
      <>
        <span className="relative">
          {children}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
            style={{ transformOrigin: 'left center' }}
          />
        </span>
      </>
    ) : variant === 'ghost' ? (
      <>
        {children}
        <span className="underline-grow" aria-hidden="true" />
      </>
    ) : (
      children
    );

  if ((props as ButtonAsLink).as === 'link') {
    const { href, ...linkRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={`${classes} ${variant === 'primary' ? 'group' : ''}`}
        {...linkRest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={`${classes} ${variant === 'primary' ? 'group' : ''}`}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {inner}
    </button>
  );
});

export default Button;
