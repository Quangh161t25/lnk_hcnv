import { Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { NAV_ITEMS } from '@/config/navigation';
import { BAO_CAO_KE_HOACH_GROUPS, HANH_CHINH_GROUPS, MODULE_ROOTS, NHAN_SU_GROUPS, HE_THONG_GROUPS, type ModuleGroupDef } from '@/config/modules';
import { IMPLEMENTED_MODULES } from '@/modules/registry';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Feedback';
import { HomePage } from '@/pages/HomePage';
import { ModuleHub, toHubGroups } from '@/pages/ModuleHub';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { LoginPage } from '@/pages/LoginPage';
import { AiAssistantPage } from '@/pages/AiAssistantPage';
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

type Section = 'hanh-chinh' | 'nhan-su' | 'bao-cao-ke-hoach' | 'he-thong';

function SubModuleRoute({ section, groups }: { section: Section; groups: ModuleGroupDef[] }) {
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
      backLabel={t(MODULE_ROOTS.find((r) => r.base === `/${section}`)?.labelKey ?? 'breadcrumb.system')}
    />
  );
}

function GuideRoute({ section, groups }: { section: Section; groups: ModuleGroupDef[] }) {
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
          <Route path="/bao-cao-ke-hoach" element={<ModuleHub groups={toHubGroups('/bao-cao-ke-hoach', BAO_CAO_KE_HOACH_GROUPS)} />} />
          <Route path="/bao-cao-ke-hoach/:moduleId" element={<SubModuleRoute section="bao-cao-ke-hoach" groups={BAO_CAO_KE_HOACH_GROUPS} />} />
          <Route path="/bao-cao-ke-hoach/:moduleId/huong-dan" element={<GuideRoute section="bao-cao-ke-hoach" groups={BAO_CAO_KE_HOACH_GROUPS} />} />
          <Route path="/he-thong" element={<ModuleHub groups={toHubGroups('/he-thong', HE_THONG_GROUPS)} />} />
          <Route path="/he-thong/:moduleId" element={<SubModuleRoute section="he-thong" groups={HE_THONG_GROUPS} />} />
          <Route path="/he-thong/:moduleId/huong-dan" element={<GuideRoute section="he-thong" groups={HE_THONG_GROUPS} />} />
          <Route path="/tro-ly-ai" element={<AiAssistantPage />} />
          {NAV_ITEMS.filter((n) => !['/', '/hanh-chinh', '/nhan-su', '/bao-cao-ke-hoach', '/he-thong', '/tro-ly-ai'].includes(n.path)).map((n) => (
            <Route key={n.path} path={`${n.path}/*`} element={<PlaceholderPage title={t(n.nameKey)} icon={n.icon} />} />
          ))}
          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
      <ConfirmDialog />
    </BrowserRouter>
  );
}
