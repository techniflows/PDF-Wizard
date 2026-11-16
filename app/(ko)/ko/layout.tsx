import RootShell from '@/components/RootShell';
import { buildMetadata, siteViewport } from '@/utils/seo';

export const metadata = buildMetadata('ko');
export const viewport = siteViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="ko">{children}</RootShell>;
}
