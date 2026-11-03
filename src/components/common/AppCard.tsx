import React from 'react';

interface AppCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  title,
  subtitle,
  action,
  icon,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div
      className={`bg-[#0f172a] border border-[#232f4e] rounded-xl shadow-xl overflow-hidden transition-all duration-200 ${className}`}
    >
      {(title || action || icon) && (
        <div className="px-5 py-4 border-b border-[#1e2a4a] flex items-center justify-between gap-3 bg-[#111c34]/50">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="text-blue-400 shrink-0">{icon}</div>}
            <div className="truncate">
              {title && (
                <h3 className="font-semibold text-slate-100 text-sm tracking-wide truncate">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

