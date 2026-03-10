// src/context/RouterContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight client-side router — no external library needed.
// Pages: "public" | "login" | "register" | "profile" | "admin"
// Usage: const { page, navigate } = useRouter();
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState } from "react";

const RouterContext = createContext(null);

export function Router({ children }) {
  const [page, setPage] = useState("public");
  const [params, setParams] = useState({});

  const navigate = (newPage, newParams = {}) => {
    setPage(newPage);
    setParams(newParams);
  };

  return (
    <RouterContext.Provider value={{ page, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export const useRouter = () => useContext(RouterContext);
