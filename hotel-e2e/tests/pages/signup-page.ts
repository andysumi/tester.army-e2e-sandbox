import type { Locator, Screen } from 'e2e';

type NewMember = {
  email: string;
  password: string;
  username: string;
  rank: string;
  address?: string;
  tel?: string;
  gender?: string;
  // YYYY-MM-DD
  birthday?: string;
  notification?: boolean;
};

export class SignupPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly passwordConfirmation: Locator;
  readonly username: Locator;
  readonly address: Locator;
  readonly tel: Locator;
  readonly gender: Locator;
  readonly birthday: Locator;
  readonly notification: Locator;
  readonly submit: Locator;

  constructor(readonly screen: Screen) {
    // 必須項目のラベルには「必須」バッジが含まれる
    this.email = screen.getByLabel('メールアドレス 必須');
    this.password = screen.getByLabel('パスワード 必須');
    this.passwordConfirmation = screen.getByLabel('パスワード（確認） 必須');
    this.username = screen.getByLabel('氏名 必須');
    this.address = screen.getByLabel('住所');
    this.tel = screen.getByLabel('電話番号');
    this.gender = screen.getByLabel('性別');
    this.birthday = screen.getByLabel('生年月日');
    this.notification = screen.getByLabel('お知らせを受け取る');
    this.submit = screen.getByRole('button', '登録');
  }

  rank(label: string): Locator {
    return this.screen.getByRole('radio', label);
  }

  // 任意項目は指定されたものだけ入力する
  async signup(member: NewMember) {
    await this.email.fill(member.email);
    await this.password.fill(member.password);
    await this.passwordConfirmation.fill(member.password);
    await this.username.fill(member.username);
    await this.rank(member.rank).check();
    if (member.address !== undefined) await this.address.fill(member.address);
    if (member.tel !== undefined) await this.tel.fill(member.tel);
    if (member.gender !== undefined) await this.gender.selectOption(member.gender);
    if (member.birthday !== undefined) await this.birthday.fill(member.birthday);
    if (member.notification) await this.notification.check();
    await this.submit.tap();
  }
}
