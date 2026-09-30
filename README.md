# Transition Tracker

Маленький трекер переходів для Telegram, Facebook, Instagram, реклами, email та будь-яких інших джерел.

Приклад:

- `https://tracker.example.com/go/tg`
- `https://tracker.example.com/go/instagram`
- `https://tracker.example.com/go/fb`

Усі посилання можуть вести на один і той самий інтернет-магазин, але статистика зберігається окремо для кожного slug.

## Що вже є

- створення необмеженої кількості tracking-посилань;
- редирект `/go/[slug]` на кінцевий URL;
- загальна кількість переходів;
- приблизна кількість унікальних відвідувачів через анонімний cookie-ID;
- статистика за 24 години та 7 днів;
- графік за останні 14 днів;
- редагування назви, slug та кінцевої адреси;
- тимчасове вимкнення посилання;
- видалення посилання;
- закрита адмінка по паролю;
- фільтрація основних preview-ботів соцмереж і browser prefetch, щоб вони не псували статистику;
- IP-адреси не зберігаються.

## 1. Створи Supabase-проєкт

1. Відкрий Supabase і створи новий проєкт.
2. Перейди в `SQL Editor`.
3. Скопіюй весь файл `supabase/schema.sql` і виконай його.
4. У `Settings -> API Keys` створи/скопіюй **Secret key** виду `sb_secret_...`.
5. Скопіюй `Project URL`.

> Secret key не можна вставляти у клієнтський код або публікувати в GitHub.

## 2. Локальний запуск

```bash
npm install
cp .env.example .env.local
```

Заповни `.env.local`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
ADMIN_PASSWORD=твій-надійний-пароль
ADMIN_SECRET=довгий-випадковий-секрет
```

Для `ADMIN_SECRET` підійде випадковий рядок на 40+ символів.

Запусти:

```bash
npm run dev
```

Адмінка буде тут:

`http://localhost:3000/admin`

## 3. GitHub

Створи новий репозиторій і завантаж цей код. Файл `.env.local` у GitHub не додавай — він уже в `.gitignore`.

## 4. Vercel

1. У Vercel натисни `Add New -> Project`.
2. Імпортуй GitHub-репозиторій.
3. Додай у `Settings -> Environment Variables`:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `ADMIN_PASSWORD`
   - `ADMIN_SECRET`
4. Зроби deploy.

Після цього отримаєш адресу на кшталт:

`https://transition-tracker.vercel.app`

І зможеш створювати:

`https://transition-tracker.vercel.app/go/tg`

`https://transition-tracker.vercel.app/go/instagram`

`https://transition-tracker.vercel.app/go/facebook`

## Як рахується унікальний відвідувач

При першому переході трекер ставить анонімний cookie `tt_visitor` з випадковим UUID. Наступні переходи з цього самого браузера мають той самий ID.

Це **не абсолютна ідентифікація людини**. Інший браузер, інший пристрій, очищення cookie або деякі in-app browser-и можуть створити новий ID. Тому показник `Унікальні` треба сприймати як приблизний.

## Важливо про превʼю соцмереж

Telegram, Facebook, LinkedIn та інші сервіси можуть самі відкривати URL, щоб побудувати preview. Такі запити не повинні виглядати як реальні кліки людей. У `lib/bots.ts` уже є фільтр основних preview/crawler user-agent-ів, а HEAD-запити не рахуються.

## Структура даних

`links` — tracking-посилання.

`clicks` — кожен реальний зарахований перехід:

- link_id;
- anonymous visitor_id;
- referrer;
- user-agent;
- дата/час.

IP-адреса не зберігається.

## Наступні можливі покращення

У цю архітектуру легко додати:

- UTM-параметри;
- CSV/Excel export;
- статистику по конкретних днях і діапазонах дат;
- QR-коди;
- окремі кампанії;
- декілька адміністраторів;
- Supabase Auth замість одного пароля;
- webhook/Telegram-повідомлення при певній кількості переходів;
- власний короткий домен, наприклад `go.brand.ua/tg`.
