import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  externalLink,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: ReactNode;
  externalLink?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-[#064e3b] to-[#059669] px-5 py-4 shadow-md shadow-emerald-900/20 relative group">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20 text-white shadow-md shadow-emerald-500/20">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight sm:text-xl leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-emerald-100/80 leading-relaxed max-w-lg">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {externalLink && (
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/20"
            title="Buka File Spreadsheet"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}
