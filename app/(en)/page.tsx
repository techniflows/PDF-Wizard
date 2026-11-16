import HomePage from '@/components/HomePage';
import { BrowserLanguageRedirect } from '@/components/LanguageSwitch';

export default function Page() {
  return (
    <>
      <BrowserLanguageRedirect from="en" />
      <HomePage lang="en" />
    </>
  );
}
