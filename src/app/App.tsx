import { ConfigProvider } from 'antd';
import { BeimeiAssemblyLinePage } from './BeimeiAssemblyLinePage';
import { ButtonLabPage } from './ButtonLabPage';
import { ComponentDemoPage } from './ComponentDemoPage';
import { ComponentDraftsPage } from './ComponentDraftsPage';
import { ComponentLabPage } from './ComponentLabPage';
import { ComponentSystemPage } from './ComponentSystemPage';
import { PageAgentPage } from './PageAgentPage';
import { WeldingInputStylePage } from './WeldingInputStylePage';

const antdTheme = {
  token: {
    colorPrimary: '#FF6900',
    colorPrimaryHover: '#E85D00',
    colorInfo: '#FF6900',
    borderRadius: 8,
    controlHeight: 32,
  },
};

export default function App() {
  const pathname = decodeURIComponent(window.location.pathname);

  if (pathname === '/button-lab' || pathname === '/primitive-lab') {
    return (
      <ConfigProvider theme={antdTheme}>
        <ButtonLabPage />
      </ConfigProvider>
    );
  }

  if (pathname === '/component-lab') {
    return (
      <ConfigProvider theme={antdTheme}>
        <ComponentLabPage />
      </ConfigProvider>
    );
  }

  if (pathname === '/component-drafts') {
    return (
      <ConfigProvider theme={antdTheme}>
        <ComponentDraftsPage />
      </ConfigProvider>
    );
  }

  if (pathname === '/component-system') {
    return (
      <ConfigProvider theme={antdTheme}>
        <ComponentSystemPage />
      </ConfigProvider>
    );
  }

  if (pathname === '/page-agent') {
    return (
      <ConfigProvider theme={antdTheme}>
        <PageAgentPage />
      </ConfigProvider>
    );
  }

  if (pathname === '/component-demo') {
    return (
      <ConfigProvider theme={antdTheme}>
        <ComponentDemoPage />
      </ConfigProvider>
    );
  }

  if (pathname === '/welding-input-style') {
    return (
      <ConfigProvider theme={antdTheme}>
        <WeldingInputStylePage />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="size-full">
        <BeimeiAssemblyLinePage />
      </div>
    </ConfigProvider>
  );
}
