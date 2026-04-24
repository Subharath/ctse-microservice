import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">ShopSphere</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} ShopSphere · Built with React + Vite</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link to="/products" className="hover:text-primary-600 transition-colors">Products</Link>
            <Link to="/orders" className="hover:text-primary-600 transition-colors">Orders</Link>
            <Link to="/cart" className="hover:text-primary-600 transition-colors">Cart</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
