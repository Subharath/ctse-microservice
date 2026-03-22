import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

const categoryColors = {
  electronics: 'bg-blue-50 text-blue-700',
  accessories: 'bg-purple-50 text-purple-700',
  clothing:    'bg-pink-50 text-pink-700',
  food:        'bg-green-50 text-green-700',
  general:     'bg-gray-50 text-gray-600',
}

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const handleAddToCart = async (e) => {
    e.stopPropagation()
    const result = await addItem({
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: 1,
    })
    if (result.success) {
      toast.success(`${product.name} added to cart`)
    } else {
      toast.error(result.message || 'Failed to add item')
    }
  }

  const catColor = categoryColors[product.category] || categoryColors.general

  return (
    <div
      onClick={() => navigate(`/products/${product.productId}`)}
      className="card overflow-hidden cursor-pointer group hover:shadow-md transition-shadow duration-200"
    >
      {/* Thumbnail placeholder */}
      <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-2 right-2 badge bg-amber-100 text-amber-800">Low Stock</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <span className={`badge flex-shrink-0 ${catColor} capitalize`}>
            {product.category}
          </span>
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 mb-3 mt-1">{product.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            <p className="text-xs text-gray-400 mt-0.5">{product.stock} in stock</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="btn-primary text-xs px-3 py-2 disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
