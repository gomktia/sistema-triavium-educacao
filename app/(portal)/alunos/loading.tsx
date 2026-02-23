export default function AlunosLoading() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-slate-200 rounded w-48" />
                <div className="h-10 bg-slate-200 rounded w-32" />
            </div>
            <div className="h-10 bg-slate-200 rounded w-full" />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-slate-200 rounded-lg" />
            ))}
        </div>
    );
}
