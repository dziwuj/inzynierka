import { createContext, useContext } from "react";

import { rootStore } from "./Root.store";

// Use the singleton instance from Root.store.tsx
export const StoreContext = createContext(rootStore);

export const useStores = () => useContext(StoreContext);
