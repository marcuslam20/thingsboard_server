import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { selectIsAuthenticated, selectIsUserLoaded, selectRequires2FA, selectRequiresForce2FA, loadUser } from '@/store/auth.slice';
import ProtectedRoute from '@/guards/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/login/LoginPage';
import SignupPage from '@/pages/login/SignupPage';
import ResetPasswordPage from '@/pages/login/ResetPasswordPage';
import TwoFactorAuthLoginPage from '@/pages/login/TwoFactorAuthLoginPage';
import CreatePasswordPage from '@/pages/login/CreatePasswordPage';
import ForceTwoFactorAuthSetupPage from '@/pages/login/ForceTwoFactorAuthSetupPage';
import LinkExpiredPage from '@/pages/login/LinkExpiredPage';
import ResetPasswordConfirmPage from '@/pages/login/ResetPasswordConfirmPage';
import HomePage from '@/pages/home/HomePage';
import DevicesPage from '@/pages/devices/DevicesPage';
import DeviceDetailPage from '@/pages/devices/DeviceDetailPage';
import DeviceProfilesPage from '@/pages/device-profiles/DeviceProfilesPage';
import AssetsPage from '@/pages/assets/AssetsPage';
import AssetDetailPage from '@/pages/assets/AssetDetailPage';
import AssetProfilesPage from '@/pages/asset-profiles/AssetProfilesPage';
import CustomersPage from '@/pages/customers/CustomersPage';
import CustomerDetailPage from '@/pages/customers/CustomerDetailPage';
import UsersPage from '@/pages/users/UsersPage';
import TenantsPage from '@/pages/tenants/TenantsPage';
import TenantDetailPage from '@/pages/tenants/TenantDetailPage';
import TenantProfilesPage from '@/pages/tenant-profiles/TenantProfilesPage';
import AlarmsPage from '@/pages/alarms/AlarmsPage';
import AuditLogsPage from '@/pages/audit-logs/AuditLogsPage';
import DashboardsPage from '@/pages/dashboards/DashboardsPage';
import DashboardViewPage from '@/pages/dashboards/DashboardViewPage';
import RuleChainsPage from '@/pages/rule-chains/RuleChainsPage';
import WidgetsPage from '@/pages/widgets/WidgetsPage';
import WidgetBundleDetailPage from '@/pages/widgets/WidgetBundleDetailPage';
import AdminPage from '@/pages/admin/AdminPage';
import EdgePage from '@/pages/edge/EdgePage';
import EdgeDetailPage from '@/pages/edge/EdgeDetailPage';
import EntityViewsPage from '@/pages/entity-views/EntityViewsPage';
import GatewaysPage from '@/pages/gateways/GatewaysPage';
import OtaUpdatesPage from '@/pages/ota-updates/OtaUpdatesPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import SecurityPage from '@/pages/security/SecurityPage';
import ApiUsagePage from '@/pages/api-usage/ApiUsagePage';
import ProfilePage from '@/pages/profile/ProfilePage';
import QueuesPage from '@/pages/queues/QueuesPage';
import ResourcesPage from '@/pages/resources/ResourcesPage';

function App() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isUserLoaded = useAppSelector(selectIsUserLoaded);
  const requires2FA = useAppSelector(selectRequires2FA);
  const requiresForce2FA = useAppSelector(selectRequiresForce2FA);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  if (!isUserLoaded) {
    return null;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/resetPassword" element={<ResetPasswordPage />} />
      <Route path="/login/resetPassword" element={<ResetPasswordConfirmPage />} />
      <Route path="/login/createPassword" element={<CreatePasswordPage />} />
      <Route path="/activationLinkExpired" element={<LinkExpiredPage />} />
      <Route path="/passwordResetLinkExpired" element={<LinkExpiredPage />} />

      {/* 2FA routes */}
      <Route path="/login/mfa" element={requires2FA ? <TwoFactorAuthLoginPage /> : <Navigate to="/login" replace />} />
      <Route path="/login/force-mfa" element={requiresForce2FA ? <ForceTwoFactorAuthSetupPage /> : <Navigate to="/login" replace />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Entities */}
          <Route path="/entities/devices" element={<DevicesPage />} />
          <Route path="/entities/devices/:deviceId" element={<DeviceDetailPage />} />
          <Route path="/entities/assets" element={<AssetsPage />} />
          <Route path="/entities/assets/:assetId" element={<AssetDetailPage />} />
          <Route path="/entities/entityViews" element={<EntityViewsPage />} />

          {/* Profiles */}
          <Route path="/profiles/deviceProfiles" element={<DeviceProfilesPage />} />
          <Route path="/profiles/assetProfiles" element={<AssetProfilesPage />} />

          {/* Dashboards */}
          <Route path="/dashboards" element={<DashboardsPage />} />
          <Route path="/dashboards/:dashboardId" element={<DashboardViewPage />} />

          {/* Customers */}
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />

          {/* Users */}
          <Route path="/users" element={<UsersPage />} />

          {/* Tenants */}
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
          <Route path="/tenantProfiles" element={<TenantProfilesPage />} />

          {/* Rule Chains */}
          <Route path="/ruleChains" element={<RuleChainsPage />} />

          {/* Edge */}
          <Route path="/edgeManagement/edges" element={<EdgePage />} />
          <Route path="/edgeManagement/edges/:edgeId" element={<EdgeDetailPage />} />

          {/* Alarms */}
          <Route path="/alarms" element={<AlarmsPage />} />

          {/* Audit Log */}
          <Route path="/security-settings/auditLogs" element={<AuditLogsPage />} />

          {/* Widgets */}
          <Route path="/widgets-bundles" element={<WidgetsPage />} />
          <Route path="/widgets-bundles/:bundleId" element={<WidgetBundleDetailPage />} />

          {/* OTA */}
          <Route path="/otaUpdates" element={<OtaUpdatesPage />} />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Gateways */}
          <Route path="/gateways" element={<GatewaysPage />} />

          {/* Admin Settings */}
          <Route path="/settings/*" element={<AdminPage />} />

          {/* Security Settings */}
          <Route path="/security-settings/*" element={<SecurityPage />} />

          {/* Queues */}
          <Route path="/queues" element={<QueuesPage />} />

          {/* Resources */}
          <Route path="/resources" element={<ResourcesPage />} />

          {/* API Usage */}
          <Route path="/usage" element={<ApiUsagePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
