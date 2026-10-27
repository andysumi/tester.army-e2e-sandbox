// サイトのトップページに掲載されている登録済みユーザ。
// メールアドレスとパスワードは e2e.config.ts の credentials にあり、account はその名前（セッション名とエージェント名にも使う）
// seesPremiumPlan: 宿泊プランの一覧に「プレミアムプラン」が表示されるか
export const premiumMember = { rank: 'プレミアム会員', account: 'premium', seesPremiumPlan: true };
export const normalMember = { rank: '一般会員', account: 'normal', seesPremiumPlan: false };

export const members = [premiumMember, normalMember];

// 会員登録で使う新規ユーザ（必須項目のみ）。ランクは既定値（プレミアム会員）と違うものにする
export const newMember = { rank: '一般会員', email: 'new-member@example.com', password: 'password123', username: '新規太郎' };

// 会員登録で使う新規ユーザ（全項目）
export const fullNewMember = {
  rank: 'プレミアム会員',
  email: 'full-member@example.com',
  password: 'password456',
  username: '全項目花子',
  address: '東京都千代田区千代田1-1',
  tel: '01133335555',
  gender: '女性',
  birthday: '1990-01-15',
  notification: true,
};
