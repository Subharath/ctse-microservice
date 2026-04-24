import { useCart } from '../context/CartContext'

export default function CartItem({ item }) {
  const { updateItem, removeItem } = useCart()

  return (
    <div className="flex items-center gap-4 py-4">
      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">${item.price.toFixed(2)} each</p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => item.quantity > 1 ? updateItem(item.productId, item.quantity - 1) : removeItem(item.productId)}
          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-8 text-center text-sm font-semibold text-gray-700">{item.quantity}</span>
        <button
          onClick={() => updateItem(item.productId, item.quantity + 1)}
          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Subtotal */}
      <div className="w-20 text-right">
        <p className="font-semibold text-gray-800 text-sm">${item.itemTotal.toFixed(2)}</p>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.productId)}
        className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
