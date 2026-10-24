import type { Locator, Screen, Secret } from 'e2e';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(readonly screen: Screen) {
    this.email = screen.getByLabel('メールアドレス');
    this.password = screen.getByLabel('パスワード');
    // ナビバーの「ログイン」リンクも role="button" のため、フォームのボタンは id で指定する
    this.submit = screen.getByTestId('login-button');
  }

  async login(email: string, password: string | Secret) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.tap();
  }
}
