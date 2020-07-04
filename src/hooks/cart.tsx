import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const checkProduct = products.find(
        existentProduct => existentProduct.id === product.id,
      );

      let updateProducts: Product[];
      if (checkProduct) {
        updateProducts = products.map(existentProducts =>
          existentProducts.id === product.id
            ? { ...product, quantity: existentProducts.quantity + 1 }
            : existentProducts,
        );
        setProducts(updateProducts);
      } else {
        updateProducts = [...products, { ...product, quantity: 1 }];
        setProducts(updateProducts);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updateProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updateProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      setProducts(updateProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updateProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProduct = products.find(product => product.id === id);

      if (findProduct?.quantity === 1) {
        setProducts(state => state.filter(product => product.id !== id));
      } else {
        setProducts(
          products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          ),
        );
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
