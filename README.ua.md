# TrackLink

Версія: **v0.1.4**

TrackLink — це невеликий self-hosted трекер переходів для Telegram, Facebook, Instagram, реклами, email-кампаній, Patreon-посилань та інших джерел трафіку.

Основний README англійською: [README.md](./README.md)  
Історія версій: [PATCHLIST.md](./PATCHLIST.md)

Приклади посилань:

- `https://твій-домен.com/go/tg`
- `https://твій-домен.com/go/instagram`
- `https://твій-домен.com/go/fb`

Усі вони можуть вести на одну й ту саму кінцеву адресу, але статистика зберігається окремо для кожного slug.

## Можливості

- необмежена кількість tracking-посилань;
- редирект `/go/[slug]` на кінцевий URL;
- загальна кількість переходів;
- приблизна кількість унікальних відвідувачів через анонімний cookie ID;
- статистика за 24 години та 7 днів;
- графік за останні 14 днів;
- редагування назви, slug та кінцевої адреси;
- увімкнення і вимкнення посилань;
- видалення посилань;
- захищена паролем адмінка;
- фільтрація основних preview-ботів соцмереж і browser prefetch;
- IP-адреси не зберігаються.

## 1. Створи Supabase-проєкт

1. Створи новий проєкт у Supabase.
2. Відкрий `SQL Editor`.
3. Виконай весь файл `supabase/schema.sql`.
4. У `Settings -> API Keys` створи або скопіюй **Secret key** виду `sb_secret_...`.
5. Скопіюй `Project URL`.

> Secret key не можна вставляти у клієнтський код або публікувати в GitHub.

## 2. Локальний запуск

Встанови залежності:

```bash
npm install
```

Створи `.env.local` на основі `.env.example` і заповни:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
ADMIN_PASSWORD=твій-надійний-пароль
ADMIN_SECRET=довгий-випадковий-секрет
```

Для `ADMIN_SECRET` використовуй випадковий рядок довжиною від 40 символів.

Запусти:

```bash
npm run dev
```

Адмінка:

`http://localhost:3000/admin`

## 3. GitHub

Створи репозиторій і завантаж код. Файл `.env.local` у GitHub не додавай — він уже виключений через `.gitignore`.

## 4. Vercel

1. У Vercel натисни `Add New -> Project`.
2. Імпортуй GitHub-репозиторій.
3. Додай у `Settings -> Environment Variables`:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `ADMIN_PASSWORD`
   - `ADMIN_SECRET`
4. Зроби deploy.

Після деплою можна створювати посилання на кшталт:

- `https://твій-проєкт.vercel.app/go/tg`
- `https://твій-проєкт.vercel.app/go/instagram`
- `https://твій-проєкт.vercel.app/go/facebook`

Пізніше можна підключити власний домен, наприклад `go.brand.com`.

## Як рахується унікальний відвідувач

При першому зарахованому переході TrackLink ставить анонімний cookie `tt_visitor` з випадковим UUID. Наступні переходи з цього самого браузера використовують той самий ID.

Це **не абсолютна ідентифікація людини**. Інший браузер, інший пристрій, очищення cookie або деякі in-app browser-и можуть створити новий ID. Тому показник `Унікальні відвідувачі` є приблизним.

## Превʼю соцмереж

Telegram, Facebook, LinkedIn та інші сервіси можуть автоматично відкривати URL, щоб створити preview. Такі запити не повинні рахуватися як реальні кліки. У `lib/bots.ts` є фільтр основних preview/crawler user-agent-ів, а HEAD-запити ігноруються.

## Структура даних

`links` — tracking-посилання.

`clicks` — кожен зарахований перехід:

- `link_id`;
- анонімний `visitor_id`;
- referrer;
- user-agent;
- дата і час.

IP-адреса не зберігається.

## Можливі наступні покращення

Архітектура дозволяє пізніше додати:

- UTM-параметри;
- CSV/Excel export;
- статистику за довільний діапазон дат;
- QR-коди;
- групи кампаній;
- декілька адміністраторів;
- Supabase Auth замість одного спільного пароля;
- webhook або Telegram-сповіщення;
- власний короткий домен, наприклад `go.brand.com/tg`.


## Усунення помилок

### Після входу адмінка показує помилку Supabase

Перевір:

- `SUPABASE_URL` у `.env.local`;
- `SUPABASE_SECRET_KEY` — це має бути серверний Secret key виду `sb_secret_...`, а не `sb_publishable_...`;
- чи був виконаний актуальний файл `supabase/schema.sql` у Supabase SQL Editor.

Після зміни `.env.local` перезапусти `npm run dev`.

### Hydration mismatch у режимі розробки

Якщо в повідомленні є сторонні атрибути на кшталт `bis_skin_checked`, `bis_register` або `__processed_...`, їх додає розширення браузера до HTML ще до запуску React. Перевір сторінку в режимі інкогніто або тимчасово вимкни розширення на `localhost`.
