import { useState, useEffect } from 'react'
import { getProducts, updateStock } from '../api/products'
import { useToast } from '../context/ToastContext'
import LoadingSpinner, { PageLoader } from '../components/LoadingSpinner'

const categoryColors = {
  electronics: 'bg-blue-50 text-blue-700',
  accessories: 'bg-purple-50 text-purple-700',
  clothing:    'bg-pink-50 text-pink-700',
  food:        'bg-green-50 text-green-700',
  general:     'bg-gray-50 text-gray-600',
}

function StockModal({ product, onClose, onUpdate }) {
  const [qty, setQty]   = useState(1)
  const [op,  setOp]    = useState('add')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const handle = async () => {
    if (!qty || qty < 1) return
    setSaving(true)
    try {
      await updateStock(product.productId, qty, op)
      toast.success('Stock updated')
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="card p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-gray-800 text-lg mb-1">Update Stock</h3>
        <p className="text-sm text-gray-500 mb-5">{product.name} · Current: <strong>{product.stock}</strong></p>

        <div className="space-y-4">
          <div>
            <label className="label">Operation</label>
            <div className="flex gap-2">
              {['add', 'subtract'].map((o) => (
                <button
                  key={o}
                  onClick={() => setOp(o)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize border transition-colors ${
                    op === o ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {o === 'add' ? '+ Add' : '− Subtract'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              min="1"
              className="input"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handle} disabled={saving} className="btn-primary flex-1">
            {saving ? <LoadingSpinner size="sm" /> : null}
            {saving ? 'Updating…' : 'Update Stock'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [products, setProducts]     = useState([])
  const [loading,  setLoading]      = useState(true)
  const [page,     setPage]         = useState(1)
  const [pagination, setPagination] = useState(null)
  const [selected, setSelected]     = useState(null)
  const toast = useToast()

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await getProducts({ page: p, limit: 12 })
      const data = res.data.data
      if (Array.isArray(data)) {
        setProducts(data)
        setPagination(null)
      } else {
        setProducts(data.products || [])
        setPagination(data.pagination || null)
      }
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage product stock and view inventory</p>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Product</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Category</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Price</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Stock</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.productId.slice(0, 12)}…</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`badge capitalize ${categoryColors[p.category] || 'bg-gray-50 text-gray-600'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-700">${p.price.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelected(p)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-3 py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <StockModal
          product={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => load()}
        />
      )}
    </div>
  )
}
