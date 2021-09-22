import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/products/${productId}`);
      const newProduct = response.data;

      const productInCart = cart.find(product => product.id === newProduct.id);

      if (productInCart !== undefined) {
        const index = cart.findIndex(product => product.id === productId);

        const stock = await api.get(`/stock/${productId}`);
        const productStock: Stock = stock.data;

        if (Number(cart[index].amount) >= Number(productStock.amount)) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        } else {
          cart[index].amount = cart[index].amount + 1

          setCart([...cart]);

          toast.success(`Quantidade do produto aumentada para ${cart[index].amount}`);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

          return;
        }
      } else {
        cart.push({ ...newProduct, amount: 1 });

        setCart([...cart]);

        toast.success('Produto adicionado ao seu carrinho');

        return localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const index = cart.findIndex(product => product.id === productId);

      if (index < 0) {
        toast.error('Erro na remoção do produto');
        return;
      } else {
        cart.splice(index, 1);

        setCart([...cart]);

        toast.success('Produto removido do seu carrinho');

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const index = cart.findIndex(product => product.id === productId);

      if (cart[index].amount <= 0) {
        return;
      }

      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);
      const productStock: Stock = stock.data;

      if (productStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (cart[index].amount > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } else {
        cart[index].amount = amount;

        setCart([...cart]);

        toast.success(`Quantidade do produto alterada para ${cart[index].amount}`);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
