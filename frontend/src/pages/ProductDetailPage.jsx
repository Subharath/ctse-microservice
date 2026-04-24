import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct } from '../api/products'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { PageLoader } from '../components/LoadingSpinner'
import { unwrapApiData } from '../api/client'

const categoryColors = {
  electronics: 'bg-blue-50 text-blue-700',
  accessories: 'bg-purple-50 text-purple-700',
  clothing:    'bg-pink-50 text-pink-700',
  food:        'bg-green-50 text-green-700',
  general:     'bg-gray-50 text-gray-700',
}

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const toast = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty]         = useState(1)
  const [adding, setAdding]   = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getProduct(productId)
        setProduct(unwrapApiData(res.data))
      } catch {
        toast.error('Product not found')
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId])

  const handleAddToCart = async () => {
    setAdding(true)
    const result = await addItem({
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: qty,
    })
    setAdding(false)
    if (result.success) {
      toast.success(`${product.name} added to cart`)
    } else {
      toast.error(result.message || 'Failed to add item')
    }
  }

  if (loading) return <PageLoader />
  if (!product) return null

  const catColor = categoryColors[product.category] || categoryColors.general
  const inStock = product.stock > 0

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <button onClick={() => navigate('/products')} className="hover:text-primary-600 transition-colors">Products</button>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="card overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="w-36 h-36 rounded-3xl bg-white shadow-md flex items-center justify-center">
              <svg className="w-20 h-20 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge capitalize ${catColor}`}>{product.category}</span>
              {!inStock && <span className="badge bg-red-100 text-red-700">Out of Stock</span>}
              {inStock && product.stock <= 5 && <span className="badge-pending">Low Stock</span>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-500 mt-3 leading-relaxed">{product.description || 'No description available.'}</p>
          </div>

          {/* Price */}
          <div className="card p-5">
            <p className="text-4xl font-extrabold text-gray-900">${product.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {inStock ? `${product.stock} units available` : 'Currently out of stock'}
            </p>
          </div>

          {/* Qty + Add to cart */}
          {inStock && (
            <div className="flex items-center gap-3">
              {/* Qty */}
              <div className="flex items-center gap-2 card px-3 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-primary-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-primary-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-primary flex-1 py-3 text-base"
              >
                {adding
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Adding…</>
                  : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>Add to Cart</>
                }
              </button>
            </div>
          )}

          {/* Meta */}
          <div className="card p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Product ID</p>
              <p className="font-mono text-gray-600 text-xs mt-0.5 truncate">{product.productId}</p>
            </div>
            <div>
              <p className="text-gray-400">Category</p>
              <p className="font-medium text-gray-700 capitalize">{product.category}</p>
            </div>
            <div>
              <p className="text-gray-400">Added</p>
              <p className="font-medium text-gray-700">{new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Stock</p>
              <p className="font-medium text-gray-700">{product.stock} units</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
