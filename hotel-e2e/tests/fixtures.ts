import { test as base } from '@e2e-dev/web';
import { LoginPage } from './pages/login-page.ts';
import { MyPage } from './pages/my-page.ts';

export const test = base.extend<{ loginPage: LoginPage; myPage: MyPage }>({
  loginPage: async ({ screen }, use) => {
    await use(new LoginPage(screen));
  },
  myPage: async ({ screen }, use) => {
    await use(new MyPage(screen));
  },
});
