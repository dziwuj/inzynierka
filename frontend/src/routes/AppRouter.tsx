import { Route, Routes } from "react-router-dom";

import { ModelViewer } from "@/components";
import {
  DashboardPage,
  LoginPage,
  NotFoundPage,
  OfflineViewerPage,
  RegisterPage,
  VerifyEmailPage,
} from "@/pages";

import { ProtectedRoute } from "./ProtectedRoute";

export const AppRouter = () => {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/offline" element={<OfflineViewerPage />} />
      <Route
        path="/offline/view/:id"
        element={<ModelViewer mode="offline" />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/viewer/:id" element={<ModelViewer mode="online" />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
