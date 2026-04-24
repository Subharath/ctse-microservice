import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center mb-6">
        <span className="text-5xl font-black text-primary-600">?</span>
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
      <p className="text-xl font-semibold text-gray-600 mb-2">Page not found</p>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Back to Home
      </Link>
    </div>
  )
}
