import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

export default {
  targets: [{
    // サイトに data-testid がないため、getByTestId で id 属性を参照する
    engine: web({ testIdAttribute: 'id' }),
    app: {
      url: process.env.APP_URL ?? 'https://hotel-example-site.takeyaqa.dev',
    },
  }],
} satisfies E2EConfig;
