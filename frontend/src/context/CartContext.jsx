import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as cartApi from '../api/cart'
import { useAuth } from './AuthContext'
import { unwrapApiData } from '../api/client'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [cart, setCart]     = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user?.userId) return
    setLoading(true)
    try {
      const res = await cartApi.getCart(user.userId)
      setCart(unwrapApiData(res.data))
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    if (isAuthenticated) fetchCart()
    else setCart(null)
  }, [isAuthenticated, fetchCart])

  const addItem = async (item) => {
    if (!user?.userId) return { success: false }
    try {
      const res = await cartApi.addItem(user.userId, item)
      setCart(unwrapApiData(res.data))
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add item' }
    }
  }

  const updateItem = async (productId, quantity) => {
    if (!user?.userId) return
    try {
      const res = await cartApi.updateItem(user.userId, productId, quantity)
      setCart(unwrapApiData(res.data))
    } catch {}
  }

  const removeItem = async (productId) => {
    if (!user?.userId) return
    try {
      const res = await cartApi.removeItem(user.userId, productId)
      setCart(unwrapApiData(res.data))
    } catch {}
  }

  const clearCart = async () => {
    if (!user?.userId) return
    try {
      await cartApi.clearCart(user.userId)
      setCart(null)
    } catch {}
  }

  const itemCount = cart?.totalItems || 0

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, fetchCart, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
