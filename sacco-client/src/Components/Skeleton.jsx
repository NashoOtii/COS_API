export function SkeletonCard() {
  return (
    <div className="stat-card animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
      <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
      <div className="h-5 bg-gray-200 rounded w-28" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="table-cell">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </td>
      <td className="table-cell">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="table-cell">
        <div className="h-4 bg-gray-200 rounded w-16" />
      </td>
      <td className="table-cell">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
      </td>
      <td className="table-cell">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="table-cell">
        <div className="h-8 bg-gray-200 rounded-lg w-20" />
      </td>
    </tr>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full">
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}