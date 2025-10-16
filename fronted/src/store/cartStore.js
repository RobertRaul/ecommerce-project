import { create } from 'zustand';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const useCartStore = create((set, get) => ({
    cart: null,
    isLoading: false,

    fetchCart: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/cart/');
            set({ cart: response.data, isLoading: false });
        } catch (error) {
            console.error('Error al obtener carrito:', error);
            set({ isLoading: false });
        }
    },

    addToCart: async (productId, quantity = 1, variantId = null) => {
        try {
            const response = await api.post('/cart/add/', {
                product_id: productId,
                quantity,
                variant_id: variantId,
            });

            set({ cart: response.data.cart });
            toast.success('Producto agregado al carrito');
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al agregar al carrito';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    },

    updateQuantity: async (itemId, quantity) => {
        try {
            const response = await api.put(`/cart/update/${itemId}/`, { quantity });
            set({ cart: response.data.cart });
            toast.success('Cantidad actualizada');
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al actualizar cantidad';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    },

    removeItem: async (itemId) => {
        try {
            const response = await api.delete(`/cart/remove/${itemId}/`);
            set({ cart: response.data.cart });
            toast.success('Producto eliminado del carrito');
            return { success: true };
        } catch (error) {
            toast.error('Error al eliminar producto');
            return { success: false };
        }
    },

    clearCart: async () => {
        try {
            const response = await api.delete('/cart/clear/');
            set({ cart: response.data.cart });
            toast.success('Carrito vaciado');
            return { success: true };
        } catch (error) {
            toast.error('Error al vaciar carrito');
            return { success: false };
        }
    },

    getTotals: () => {
        const { cart } = get();
        if (!cart || !cart.items) {
            return { subtotal: 0, totalItems: 0 };
        }
        return {
            subtotal: cart.subtotal,
            totalItems: cart.total_items,
        };
    },
}));

export default useCartStore;