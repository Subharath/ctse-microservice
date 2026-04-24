import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrder } from '../api/orders'
import { getPaymentByOrder } from '../api/payments'
import { PageLoader } from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateOrderStatus } from '../api/orders'
import { updatePaymentStatus } from '../api/payments'
import { unwrapApiData } from '../api/client'

const statusClass = {
  pending:   'badge-pending',
  confirmed: 'badge-confirmed',
  shipped:   'badge-shipped',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled',
  paid:      'badge-paid',
  failed:    'badge-failed',
}

const payStatusClass = {
  pending:   'badge-pending',
  paid:      'badge-paid',
  failed:    'badge-failed',
  refunded:  'badge-cancelled',
}

const ORDER_STATUSES  = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'failed']
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useAuth()
  const toast = useToast()

  const [order,   setOrder]   = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingOrder,   setUpdatingOrder]   = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [orderRes, payRes] = await Promise.allSettled([
          getOrder(orderId),
          getPaymentByOrder(orderId),
        ])
        if (orderRes.status === 'fulfilled') setOrder(unwrapApiData(orderRes.value.data))
        if (payRes.status === 'fulfilled')   setPayment(unwrapApiData(payRes.value.data))
      } catch {
        toast.error('Order not found')
        navigate('/orders')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  const handleOrderStatus = async (status) => {
    setUpdatingOrder(true)
    try {
      const res = await updateOrderStatus(orderId, status)
      setOrder((o) => ({ ...o, status }))
      toast.success('Order status updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handlePaymentStatus = async (status) => {
    if (!payment) return
    setUpdatingPayment(true)
    try {
      await updatePaymentStatus(payment.paymentId, status)
      setPayment((p) => ({ ...p, status }))
      toast.success('Payment status updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment')
    } finally {
      setUpdatingPayment(false)
    }
  }

  if (loading) return <PageLoader />
  if (!order)  return null

  const date = new Date(order.createdAt).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const addr = order.shippingAddress
  const hasAddr = addr && (addr.street || addr.city)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/orders')}
        className="btn-ghost mb-5 -ml-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderId.slice(0, 8).toUpperCase()}</h1>
          <p className="text-gray-400 text-sm mt-1">{date}</p>
        </div>
        <span className={statusClass[order.status] || 'badge bg-gray-100 text-gray-600'}>
          {order.status}
        </span>
      </div>

      <div className="space-y-5">
        {/* Items */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Items Ordered</h2>
          <div className="divide-y divide-gray-50">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">${item.price?.toFixed(2)} × {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-700">${((item.price || 0) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>${order.totalPrice?.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping */}
        {hasAddr && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-3">Shipping Address</h2>
            <p className="text-sm text-gray-600">
              {addr.street && <span>{addr.street}, </span>}
              {addr.city && <span>{addr.city}, </span>}
              {addr.state && <span>{addr.state} </span>}
              {addr.zip && <span>{addr.zip}, </span>}
              {addr.country}
            </p>
          </div>
        )}

        {/* Payment */}
        {payment && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Payment</h2>
              <span className={payStatusClass[payment.status] || 'badge bg-gray-100 text-gray-600'}>
                {payment.status}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Amount</p>
                <p className="font-semibold text-gray-800">${payment.amount?.toFixed(2)} {payment.currency}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Method</p>
                <p className="font-medium text-gray-700 capitalize">{payment.method}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Payment ID</p>
                <p className="font-mono text-gray-600 text-xs truncate">{payment.paymentId?.slice(0, 12)}…</p>
              </div>
            </div>

            {/* Admin: update payment status */}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Update Payment Status</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handlePaymentStatus(s)}
                      disabled={updatingPayment || payment.status === s}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                        payment.status === s
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin: update order status */}
        {isAdmin && (
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update Order Status</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleOrderStatus(s)}
                  disabled={updatingOrder || order.status === s}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    order.status === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
