import { Link } from 'react-router-dom'

const statusClass = {
  pending:   'badge-pending',
  confirmed: 'badge-confirmed',
  shipped:   'badge-shipped',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled',
}

export default function OrderCard({ order }) {
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <Link to={`/orders/${order.orderId}`} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow duration-200 block">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 text-sm">Order #{order.orderId.slice(0, 8).toUpperCase()}</p>
          <span className={statusClass[order.status] || 'badge bg-gray-100 text-gray-600'}>{order.status}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{date}</p>
        <p className="text-xs text-gray-500 mt-1">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">${order.totalPrice?.toFixed(2)}</p>
        </div>
        <svg className="w-5 h-5 text-gray-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
