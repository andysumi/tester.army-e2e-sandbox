import { test as base } from '@e2e-dev/web';
import { LoginPage } from './pages/login-page.ts';
import { MyPage } from './pages/my-page.ts';
import { SignupPage } from './pages/signup-page.ts';

export const test = base.extend<{ loginPage: LoginPage; myPage: MyPage; signupPage: SignupPage }>({
  loginPage: async ({ screen }, use) => {
    await use(new LoginPage(screen));
  },
  myPage: async ({ screen }, use) => {
    await use(new MyPage(screen));
  },
  signupPage: async ({ screen }, use) => {
    await use(new SignupPage(screen));
  },
});
