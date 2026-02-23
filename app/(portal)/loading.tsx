export default function PortalLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-200 rounded-lg" />
                ))}
            </div>
            <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
    );
}
