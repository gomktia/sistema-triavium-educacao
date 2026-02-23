export default function TurmaLoading() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-slate-200 rounded w-56" />
                <div className="h-10 bg-slate-200 rounded w-40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-28 bg-slate-200 rounded-lg" />
                ))}
            </div>
        </div>
    );
}
