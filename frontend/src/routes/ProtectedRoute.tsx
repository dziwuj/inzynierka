import { useStores } from "@stores/useStores";
import { observer } from "mobx-react";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = observer(() => {
  const { authStore } = useStores();
  const { isAuthenticated, isOfflineMode } = authStore;

  return isAuthenticated || isOfflineMode ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
});
