import { Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { NAV_ITEMS } from '@/config/navigation';
import { HANH_CHINH_GROUPS, NHAN_SU_GROUPS, type ModuleGroupDef } from '@/config/modules';
import { IMPLEMENTED_MODULES } from '@/modules/registry';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Feedback';
import { HomePage } from '@/pages/HomePage';
import { ModuleHub, toHubGroups } from '@/pages/ModuleHub';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { LoginPage } from '@/pages/LoginPage';
import { useAuthStore } from '@/stores/auth';

const PAGE_FALLBACK = (
  <div className="flex-1 flex items-center justify-center py-20">
    <Spinner text={t('common.loading')} />
  </div>
);

function findModule(groups: ModuleGroupDef[], slug: string) {
  for (const g of groups) {
    const m = g.items.find((i) => i.slug === slug);
    if (m) return m;
  }
  return undefined;
}

function SubModuleRoute({ section, groups }: { section: 'hanh-chinh' | 'nhan-su'; groups: ModuleGroupDef[] }) {
  const { moduleId = '' } = useParams();
  const Page = IMPLEMENTED_MODULES[`${section}/${moduleId}`];
  if (Page) {
    return (
      <Suspense fallback={PAGE_FALLBACK}>
        <Page />
      </Suspense>
    );
  }
  const def = findModule(groups, moduleId);
  return (
    <PlaceholderPage
      title={def ? t(def.titleKey) : undefined}
      icon={def?.icon}
      backTo={`/${section}`}
      backLabel={t(section === 'hanh-chinh' ? 'breadcrumb.hanhChinh' : 'breadcrumb.nhanSu')}
    />
  );
}

function GuideRoute({ section, groups }: { section: 'hanh-chinh' | 'nhan-su'; groups: ModuleGroupDef[] }) {
  const { moduleId = '' } = useParams();
  const def = findModule(groups, moduleId);
  return <PlaceholderPage title={def ? `${t('guide.buttonTitle')}: ${t(def.titleKey)}` : undefined} backTo={`/${section}`} />;
}

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/hanh-chinh" element={<ModuleHub groups={toHubGroups('/hanh-chinh', HANH_CHINH_GROUPS)} />} />
          <Route path="/hanh-chinh/:moduleId" element={<SubModuleRoute section="hanh-chinh" groups={HANH_CHINH_GROUPS} />} />
          <Route path="/hanh-chinh/:moduleId/huong-dan" element={<GuideRoute section="hanh-chinh" groups={HANH_CHINH_GROUPS} />} />
          <Route path="/nhan-su" element={<ModuleHub groups={toHubGroups('/nhan-su', NHAN_SU_GROUPS)} />} />
          <Route path="/nhan-su/:moduleId" element={<SubModuleRoute section="nhan-su" groups={NHAN_SU_GROUPS} />} />
          <Route path="/nhan-su/:moduleId/huong-dan" element={<GuideRoute section="nhan-su" groups={NHAN_SU_GROUPS} />} />
          {NAV_ITEMS.filter((n) => !['/', '/hanh-chinh', '/nhan-su'].includes(n.path)).map((n) => (
            <Route key={n.path} path={`${n.path}/*`} element={<PlaceholderPage title={t(n.nameKey)} icon={n.icon} />} />
          ))}
          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
      <ConfirmDialog />
    </BrowserRouter>
  );
}
