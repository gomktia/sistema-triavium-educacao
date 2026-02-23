export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-200 rounded-lg" />
                ))}
            </div>
            <div className="h-96 bg-slate-200 rounded-lg" />
        </div>
    );
}
