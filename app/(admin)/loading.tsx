export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="rounded-2xl bg-gradient-to-r from-[#064e3b] to-[#059669] px-5 py-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/20" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-white/20" />
            <div className="h-3 w-48 rounded bg-white/10" />
          </div>
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 mb-4" />
            <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
            <div className="h-8 w-16 bg-slate-100 rounded mb-3" />
            <div className="h-1 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
