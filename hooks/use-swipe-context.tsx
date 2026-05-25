import { createContext, useContext, useState, type ReactNode } from 'react';

interface SwipeContextType {
  currentIndex: number;
  totalScreens: number;
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  setCurrentIndex: (index: number) => void;
  setTotalScreens: (total: number) => void;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

export const SwipeProvider = ({ children, initialIndex = 0, totalScreens = 0 }: { children: ReactNode; initialIndex?: number; totalScreens?: number }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [total, setTotalScreens] = useState(totalScreens);

  // Can swipe right if not at first screen
  const canSwipeRight = currentIndex > 0;
  // Can swipe left if not at last screen
  const canSwipeLeft = currentIndex < total - 1;

  return (
    <SwipeContext.Provider
      value={{
        currentIndex,
        totalScreens: total,
        canSwipeLeft,
        canSwipeRight,
        setCurrentIndex,
        setTotalScreens,
      }}
    >
      {children}
    </SwipeContext.Provider>
  );
};

export const useSwipeContext = () => {
  const context = useContext(SwipeContext);
  if (!context) {
    throw new Error('useSwipeContext must be used within a SwipeProvider');
  }
  return context;
};
