import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'link-danger' | 'link-success';

const BASE = 'inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface items-center justify-center gap-1.5 font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none';

const VARIANTS: Record<Variant, string> = {
  primary: `${BASE} rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accent-ink shadow-subtle`,
  secondary: `${BASE} rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink hover:bg-surface-2`,
  ghost: `${BASE} rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-surface-2 hover:text-ink`,
  danger: `${BASE} rounded-xl bg-danger px-4 py-2 text-sm text-white hover:bg-danger/90 shadow-subtle`,
  link: 'text-xs font-medium text-accent-ink hover:underline disabled:opacity-40 disabled:pointer-events-none',
  'link-danger': 'text-xs font-medium text-danger hover:underline disabled:opacity-40 disabled:pointer-events-none',
  'link-success': 'text-xs font-medium text-success hover:underline disabled:opacity-40 disabled:pointer-events-none',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className = '', type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} {...props} className={`${VARIANTS[variant]} ${className}`} />;
});

export default Button;
