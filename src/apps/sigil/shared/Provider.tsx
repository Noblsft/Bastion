import { createContext, ReactNode } from 'react';

const SigilContext = createContext({});

export function Provider({ children }: { children: ReactNode }) {
  const value = {};

  return <SigilContext.Provider value={value}>{children}</SigilContext.Provider>;
}
