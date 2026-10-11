import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...a) => twMerge(clsx(a))

export function Button({ children, variant = 'primary', size = 'md', className, disabled, loading, ...props }) {
  const variants = {
    primary: 'bg-[#ff6b6b] text-white hover:bg-[#e05555] active:scale-95',
    outline: 'border border-[#e5e7eb] bg-white text-[#1a1a2e] hover:bg-[#f3f4f6] active:scale-95',
    ghost:   'text-[#6b7280] hover:bg-[#f3f4f6] active:scale-95',
    danger:  'bg-red-500 text-white hover:bg-red-600 active:scale-95',
    success: 'bg-[#00c9a7] text-white hover:bg-[#00a88b] active:scale-95',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'w-9 h-9 p-0',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold cursor-pointer transition-all select-none',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  )
}

export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-[#6b7280]">{label}</label>}
      <input
        className={cn(
          'w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] bg-white',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Card({ children, className, ...props }) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-4', className)} {...props}>
      {children}
    </div>
  )
}

export function Chip({ children, active, className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors',
        active ? 'bg-[#ff6b6b] text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#ff6b6b] hover:text-white',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function Spinner({ size = 20, className }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn('border-2 border-[#e5e7eb] border-t-[#ff6b6b] rounded-full animate-spin inline-block', className)}
    />
  )
}

export function EmptyState({ icon = '🍽️', title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg text-[#1a1a2e] mb-1">{title}</h3>
      {body && <p className="text-sm text-[#6b7280] mb-4">{body}</p>}
      {action}
    </div>
  )
}

export function SectionLabel({ children, className }) {
  return (
    <div className={cn('text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2', className)}>
      {children}
    </div>
  )
}

export function MacroPill({ label, value, unit = 'g', color }) {
  const colors = {
    protein: 'bg-blue-50 text-blue-700',
    carbs:   'bg-yellow-50 text-yellow-700',
    fat:     'bg-orange-50 text-orange-700',
    cal:     'bg-red-50 text-[#ff6b6b]',
    fiber:   'bg-green-50 text-green-700',
  }
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full', colors[color] || 'bg-gray-100 text-gray-600')}>
      <span className="font-black">{value}</span>
      <span className="font-normal opacity-70">{unit} {label}</span>
    </span>
  )
}
