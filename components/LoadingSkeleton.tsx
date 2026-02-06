export default function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4">
            <div className="w-32 h-32 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
