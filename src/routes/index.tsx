import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard } from '../components/common/AuthGuard';
import MainLayout from '../components/layout/MainLayout';
import { LoadingState } from '../components/common/LoadingState';
import { USER_ROLES } from '../constants';

// Keep LoginPage as direct import (initial route)
import LoginPage from '../features/auth/LoginPage';

// Lazy load all page components for code splitting
const DashboardPage = React.lazy(() => import('../features/dashboard/DashboardPage'));
const ProductsPage = React.lazy(() => import('../features/products/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('../features/products/ProductDetailPage'));
const ContainersPage = React.lazy(() => import('../features/containers/ContainersPage'));
const ContainerDetailPage = React.lazy(() => import('../features/containers/ContainerDetailPage'));
const ContactsPage = React.lazy(() => import('../features/contacts/ContactsPage'));
const ContactDetailPage = React.lazy(() => import('../features/contacts/ContactDetailPage'));
const InventoryPage = React.lazy(() => import('../features/inventory/InventoryPage'));
const InventoryLogsPage = React.lazy(() => import('../features/inventory/InventoryLogsPage'));
const TransactionsPage = React.lazy(() => import('../features/transactions/TransactionsPage'));
const TransactionDetailPage = React.lazy(() => import('../features/transactions/TransactionDetailPage'));
const CreateSalePage = React.lazy(() => import('../features/transactions/CreateSalePage'));
const CreatePurchasePage = React.lazy(() => import('../features/transactions/CreatePurchasePage'));
const CreateDeodapBillPage = React.lazy(() => import('../features/transactions/CreateDeodapBillPage'));
const PaymentsPage = React.lazy(() => import('../features/payments/PaymentsPage'));
const UsersPage = React.lazy(() => import('../features/users/UsersPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingState />}>
            <DashboardPage />
          </Suspense>
        } />
        
        {/* Products */}
        <Route path="/products" element={
          <Suspense fallback={<LoadingState />}>
            <ProductsPage />
          </Suspense>
        } />
        <Route path="/products/:id" element={
          <Suspense fallback={<LoadingState />}>
            <ProductDetailPage />
          </Suspense>
        } />
        
        {/* Containers */}
        <Route path="/containers" element={
          <Suspense fallback={<LoadingState />}>
            <ContainersPage />
          </Suspense>
        } />
        <Route path="/containers/:id" element={
          <Suspense fallback={<LoadingState />}>
            <ContainerDetailPage />
          </Suspense>
        } />
        
        {/* Contacts */}
        <Route path="/contacts" element={
          <Suspense fallback={<LoadingState />}>
            <ContactsPage />
          </Suspense>
        } />
        <Route path="/contacts/:id" element={
          <Suspense fallback={<LoadingState />}>
            <ContactDetailPage />
          </Suspense>
        } />
        
        {/* Inventory */}
        <Route path="/inventory" element={
          <Suspense fallback={<LoadingState />}>
            <InventoryPage />
          </Suspense>
        } />
        <Route path="/inventory/logs" element={
          <Suspense fallback={<LoadingState />}>
            <InventoryLogsPage />
          </Suspense>
        } />
        
        {/* Transactions */}
        <Route path="/transactions" element={
          <Suspense fallback={<LoadingState />}>
            <TransactionsPage />
          </Suspense>
        } />
        <Route path="/transactions/new-sale" element={
          <Suspense fallback={<LoadingState />}>
            <CreateSalePage />
          </Suspense>
        } />
        <Route path="/transactions/new-purchase" element={
          <Suspense fallback={<LoadingState />}>
            <CreatePurchasePage />
          </Suspense>
        } />
        <Route path="/transactions/new-deodap-bill" element={
          <Suspense fallback={<LoadingState />}>
            <CreateDeodapBillPage />
          </Suspense>
        } />
        <Route path="/transactions/:id" element={
          <Suspense fallback={<LoadingState />}>
            <TransactionDetailPage />
          </Suspense>
        } />
        
        {/* Payments */}
        <Route path="/payments" element={
          <Suspense fallback={<LoadingState />}>
            <PaymentsPage />
          </Suspense>
        } />
        
        {/* Users - Admin only */}
        <Route
          path="/users"
          element={
            <Suspense fallback={<LoadingState />}>
              <AuthGuard allowedRoles={[USER_ROLES.ADMIN]}>
                <UsersPage />
              </AuthGuard>
            </Suspense>
          }
        />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
