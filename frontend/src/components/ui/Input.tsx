/**
 * Premium Input Component
 * Sophisticated input with error handling and micro-interactions
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export default function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  const baseClasses = 'w-full px-4 py-3 bg-navy-900 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200'

  const stateClasses = error
    ? 'border-rose-500 focus:ring-rose-500'
    : 'border-slate-600 focus:ring-emerald-500'

  const classes = `${baseClasses} ${stateClasses} ${icon ? 'pl-12' : ''} ${className}`

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <input className={classes} {...props} />
      </div>
      {error && (
        <p className="text-sm text-rose-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
