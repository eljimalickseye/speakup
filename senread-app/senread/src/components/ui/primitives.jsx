export function IconButton({ children, active = false, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors
        ${active ? 'text-gold bg-transparent' : 'text-ink bg-surface hover:text-gold'}
        ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Tag({ children }) {
  return (
    <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-surface text-ink border border-surface-line font-mono uppercase tracking-wider">
      {children}
    </span>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="h-1 rounded-full bg-surface-line overflow-hidden">
      <div
        className="h-full rounded-full bg-gold"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export function Ring({ value, size = 30 }) {
  const pct = Math.round(value * 100);
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--color-gold) ${pct}%, var(--color-surface-line) 0)`,
      }}
    >
      <div
        className="rounded-full bg-paper flex items-center justify-center text-[8px] font-bold text-taupe"
        style={{ width: size - 8, height: size - 8 }}
      >
        {pct}%
      </div>
    </div>
  );
}

export function CoverArt({ gradient = '', className = '', children }) {
  const isCssGradient = gradient.includes('gradient') || gradient.includes('#') || gradient.includes('rgb');
  const bgClass = isCssGradient ? '' : (gradient.startsWith('bg-') ? gradient : `bg-gradient-to-br ${gradient}`);
  const inlineStyle = isCssGradient ? { background: gradient } : {};

  return (
    <div
      className={`rounded-lg flex items-end p-2 text-white shadow-[0_10px_18px_-8px_rgba(0,0,0,0.35)] ${bgClass} ${className}`}
      style={inlineStyle}
    >
      {children}
    </div>
  );
}
