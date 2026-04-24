import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { cancelOrder, createOrder } from '../api/orders'
import { createPayment } from '../api/payments'
import LoadingSpinner from '../components/LoadingSpinner'
import { unwrapApiData } from '../api/client'

const PAYMENT_METHODS = [
  { id: 'card',       label: 'Credit / Debit Card',  icon: '💳' },
  { id: 'paypal',     label: 'PayPal',               icon: '🅿️' },
  { id: 'bank',       label: 'Bank Transfer',        icon: '🏦' },
]

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [step, setStep]     = useState(1) // 1 = shipping, 2 = payment, 3 = confirm
  const [submitting, setSubmitting] = useState(false)

  const [shipping, setShipping] = useState({
    street: '', city: '', state: '', zip: '', country: 'US',
  })
  const [payMethod, setPayMethod] = useState('card')
  const [shippingErrors, setShippingErrors] = useState({})

  const items = cart?.items || []
  const total = cart?.totalPrice || 0

  const validateShipping = () => {
    const e = {}
    if (!shipping.street.trim()) e.street = 'Required'
    if (!shipping.city.trim())   e.city   = 'Required'
    if (!shipping.state.trim())  e.state  = 'Required'
    if (!shipping.zip.trim())    e.zip    = 'Required'
    return e
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      navigate('/cart')
      return
    }
    setSubmitting(true)
    let createdOrder = null
    try {
      // 1. Create order
      const orderRes = await createOrder(
        items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity, price: i.price })),
        shipping,
        ''
      )
      const order = unwrapApiData(orderRes.data)
      createdOrder = order

      // 2. Create payment
      await createPayment({
        orderId: order.orderId,
        amount: total,
        currency: 'USD',
        method: payMethod,
      })

      // 3. Clear cart
      await clearCart()

      toast.success('Order placed successfully!')
      navigate(`/orders/${order.orderId}`)
    } catch (err) {
      if (createdOrder?.orderId) {
        try {
          await cancelOrder(createdOrder.orderId, 'failed')
        } catch {
          // Preserve the original checkout error as the primary failure signal.
        }
      }
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [items.length, navigate])

  if (items.length === 0) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="section-title mb-6">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {['Shipping', 'Payment', 'Confirm'].map((label, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done   ? 'bg-green-500 text-white' :
                  active ? 'bg-primary-600 text-white' :
                           'bg-gray-100 text-gray-400'
                }`}>
                  {done ? '✓' : num}
                </div>
                <span className={`text-sm font-medium ${active ? 'text-primary-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-3 ${step > num ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 card p-6">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-5">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Street Address</label>
                  <input
                    className={`input ${shippingErrors.street ? 'border-red-300' : ''}`}
                    placeholder="123 Main St, Apt 4"
                    value={shipping.street}
                    onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                  />
                  {shippingErrors.street && <p className="text-red-500 text-xs mt-1">{shippingErrors.street}</p>}
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    className={`input ${shippingErrors.city ? 'border-red-300' : ''}`}
                    placeholder="New York"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  />
                  {shippingErrors.city && <p className="text-red-500 text-xs mt-1">{shippingErrors.city}</p>}
                </div>
                <div>
                  <label className="label">State / Province</label>
                  <input
                    className={`input ${shippingErrors.state ? 'border-red-300' : ''}`}
                    placeholder="NY"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                  />
                  {shippingErrors.state && <p className="text-red-500 text-xs mt-1">{shippingErrors.state}</p>}
                </div>
                <div>
                  <label className="label">ZIP / Postal Code</label>
                  <input
                    className={`input ${shippingErrors.zip ? 'border-red-300' : ''}`}
                    placeholder="10001"
                    value={shipping.zip}
                    onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                  />
                  {shippingErrors.zip && <p className="text-red-500 text-xs mt-1">{shippingErrors.zip}</p>}
                </div>
                <div>
                  <label className="label">Country</label>
                  <select
                    className="input"
                    value={shipping.country}
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="CA">Canada</option>
                    <option value="LK">Sri Lanka</option>
                    <option value="IN">India</option>
                    <option value="SG">Singapore</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  const e = validateShipping()
                  if (Object.keys(e).length) { setShippingErrors(e); return }
                  setShippingErrors({})
                  setStep(2)
                }}
                className="btn-primary mt-6"
              >
                Continue to Payment
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-5">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      payMethod === m.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      value={m.id}
                      checked={payMethod === m.id}
                      onChange={() => setPayMethod(m.id)}
                      className="accent-primary-600"
                    />
                    <span className="text-xl">{m.icon}</span>
                    <span className="font-medium text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary">
                  Review Order
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-5">Review & Confirm</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Shipping To</p>
                  <p className="text-sm text-gray-700">{shipping.street}, {shipping.city}, {shipping.state} {shipping.zip}, {shipping.country}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment</p>
                  <p className="text-sm text-gray-700">{PAYMENT_METHODS.find(m => m.id === payMethod)?.label}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name} × {item.quantity}</span>
                        <span className="font-medium">${item.itemTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="btn-secondary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="btn-primary flex-1 justify-center py-3"
                >
                  {submitting ? <><LoadingSpinner size="sm" />Placing Order…</> : <>Place Order — ${total.toFixed(2)}</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary sidebar */}
        <div className="card p-5 h-fit">
          <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-gray-600">
                <span className="truncate pr-2">{item.name} ×{item.quantity}</span>
                <span className="flex-shrink-0">${item.itemTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
