import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { unwrapApiData } from '../api/client'

const StatCard = ({ label, value, icon, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

export default function HomePage() {
  const { user } = useAuth()
  const { cart } = useCart()
  const [featured, setFeatured] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProducts({ page: 1, limit: 4 })
        const data = unwrapApiData(res.data)
        setFeatured(Array.isArray(data) ? data.slice(0, 4) : (data.products || []).slice(0, 4))
      } catch {
        setFeatured([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cartCount = cart?.totalItems || 0
  const cartTotal = cart?.totalPrice || 0

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 p-8 sm:p-12 text-white">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -right-5 -bottom-12 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-widest mb-2">Welcome back</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Hello, {user?.name?.split(' ')[0] || 'Shopper'} 👋
          </h1>
          <p className="text-primary-100 text-lg mb-6 max-w-lg">
            Discover thousands of products, manage your orders, and enjoy a seamless shopping experience.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Shop Now
            </Link>
            <Link to="/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors">
              My Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Cart Items"
          value={cartCount}
          color="bg-primary-50"
          icon={
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Cart Value"
          value={`$${cartTotal.toFixed(2)}`}
          color="bg-green-50"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Account"
          value={user?.role === 'admin' ? 'Admin' : 'User'}
          color="bg-purple-50"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label="Products"
          value="Browse"
          color="bg-amber-50"
          icon={
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      {/* Featured products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-primary-600 text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            to: '/cart',
            label: 'View Cart',
            sub: `${cartCount} item${cartCount !== 1 ? 's' : ''}`,
            color: 'bg-primary-600',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
          },
          {
            to: '/orders',
            label: 'My Orders',
            sub: 'Track your orders',
            color: 'bg-indigo-500',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
          },
          {
            to: `/profile/${user?.userId}`,
            label: 'My Profile',
            sub: user?.email,
            color: 'bg-purple-600',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center flex-shrink-0`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {item.icon}
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800">{item.label}</p>
              <p className="text-sm text-gray-500 truncate">{item.sub}</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
