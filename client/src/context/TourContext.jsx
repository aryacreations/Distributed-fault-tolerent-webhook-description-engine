import React, { createContext, useContext, useState } from 'react';
import sounds from '../utils/soundEngine';

const TourContext = createContext({
  isTourActive: false,
  toggleTour: () => {},
  setIsTourActive: () => {},
});

export function TourProvider({ children }) {
  // Tour is OFF by default as requested
  const [isTourActive, setIsTourActive] = useState(false);

  const toggleTour = () => {
    setIsTourActive((prev) => {
      const next = !prev;
      if (next) {
        sounds.playSuccess();
      } else {
        sounds.playClick();
      }
      return next;
    });
  };

  return (
    <TourContext.Provider value={{ isTourActive, toggleTour, setIsTourActive }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}

export default TourContext;
