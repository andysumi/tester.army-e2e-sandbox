import type { Locator, Screen } from 'e2e';

export class MyPage {
  readonly email: Locator;
  readonly username: Locator;
  readonly rank: Locator;
  readonly address: Locator;
  readonly tel: Locator;
  readonly gender: Locator;
  readonly birthday: Locator;
  readonly notification: Locator;

  constructor(readonly screen: Screen) {
    this.email = screen.getByTestId('email');
    this.username = screen.getByTestId('username');
    this.rank = screen.getByTestId('rank');
    this.address = screen.getByTestId('address');
    this.tel = screen.getByTestId('tel');
    this.gender = screen.getByTestId('gender');
    this.birthday = screen.getByTestId('birthday');
    this.notification = screen.getByTestId('notification');
  }
}
