import type { Locator, Screen } from 'e2e';

export class MyPage {
  readonly email: Locator;
  readonly rank: Locator;

  constructor(readonly screen: Screen) {
    this.email = screen.getByTestId('email');
    this.rank = screen.getByTestId('rank');
  }
}
