# TrackLink — Patch List / Список змін

This file is maintained for every release in English and Ukrainian.  
Цей файл оновлюється для кожної версії англійською та українською мовами.

---


## v0.4.1 — Group styling polish and pastel color coding

### English

- Refined the group-name field styling and spacing in the group manager.
- Restyled group selectors and dropdown fields to look cleaner and more consistent.
- Added pastel background color presets for link groups.
- Added background-color selection when creating or editing a group.
- Applied selected group colors to grouped link sections and group badges.
- Updated the demo page to reflect group color styling.
- Added the `background_color` field to the Supabase schema upgrade script.

### Українська

- Покращено вигляд рамки та відступів у полі назви групи.
- Оновлено стилі випадаючих списків, щоб вони виглядали акуратніше й сучасніше.
- Додано пастельні приглушені кольори фону для груп посилань.
- Додано вибір кольору під час створення та редагування групи.
- Обраний колір тепер застосовується до секцій груп у списку посилань і до бейджів груп.
- Оновлено демо-сторінку, щоб вона теж показувала кольорові групи.
- Оновлено `supabase/schema.sql`: додано поле `background_color`.

**Commit:** `feat: add group color themes and polish group inputs`  
**Release tag:** `v0.4.1`

---

## v0.4.0 — Bilingual UI and safer destructive actions

### English

- Added site-wide EN / UA language switching on login, admin, and demo pages.
- English is now the default interface language.
- Language selection is persisted in a cookie.
- Centered the `Open demo` button label.
- Updated the password visibility icon so its visual state matches whether the password is hidden or visible.
- Improved spacing and styling of the `New group` field.
- Added confirmation dialogs before deleting links or groups.
- Localized admin action messages, period cards, click details, demo content, and controls.
- Added `ROADMAP.md` with the planned TrackLink development directions.
- No database schema migration is required for this release.

### Українська

- Додано перемикання мов EN / UA на сторінці входу, в адмінці та демо.
- Англійська мова тепер використовується за замовчуванням.
- Обрана мова зберігається в cookie.
- Текст кнопки `Відкрити демо` вирівняно по центру.
- Стан іконки ока тепер відповідає стану пароля: закритий пароль — закрите око, видимий пароль — відкрите око.
- Покращено відступи та оформлення поля `Нова група`.
- Додано вікна підтвердження перед видаленням посилань і груп.
- Локалізовано повідомлення адмінських дій, періоди статистики, деталізацію переходів, демо та елементи керування.
- Додано `ROADMAP.md` із зафіксованим планом подальшого розвитку TrackLink.
- Міграція бази даних для цього релізу не потрібна.

**Commit:** `feat: add bilingual UI and delete confirmations`  
**Release tag:** `v0.4.0`

---

## v0.3.0 — Public demo and link groups

### English

- Added a public `/demo` page accessible from the login screen.
- Demo mode uses only static sample data and does not connect to Supabase or grant admin permissions.
- Added demo period analytics, click-detail examples, grouped links, and a read-only create-link form.
- Added persistent link groups backed by the new `link_groups` Supabase table.
- Added group selection when creating or editing a tracking link.
- Added group creation, rename, and deletion in the admin area.
- Deleting a group keeps its links and moves them to `No group`.
- Grouped the `Your links` section into collapsible destination/campaign sections.
- Added group names to detailed click records.
- Reserved the `/demo` slug so it cannot be used as a tracking link.
- Updated the application and database schema version to `v0.3.0`.

### Українська

- На сторінку входу додано кнопку для відкриття публічного `/demo`.
- Демо працює тільки на статичних тестових даних, не підключається до Supabase і не надає адмінських прав.
- У демо додано приклади статистики за періодами, деталізації переходів, груп посилань і read-only форми створення посилання.
- Додано постійні групи посилань через нову таблицю Supabase `link_groups`.
- При створенні та редагуванні посилання можна вибрати групу.
- В адмінці можна створювати, перейменовувати та видаляти групи.
- Видалення групи не видаляє посилання — вони переходять у `Без групи`.
- Секцію `Твої посилання` розбито на згортані групи за ресурсом/кампанією.
- Назву групи додано до деталізації переходів.
- Slug `/demo` зарезервовано системою.
- Версію застосунку та схеми бази оновлено до `v0.3.0`.

**Commit:** `feat: add public demo and link groups`  
**Release tag:** `v0.3.0`

---

## v0.2.0 — Period analytics, click details and short URLs

### English

- Added the `System / Database` status section.
- Rebuilt top-level analytics into four periods: today, last 7 days, current month, and all time.
- Added `Unique` and `Total clicks` metrics to every period card.
- Made period cards clickable; selecting one opens matching click records.
- Added the same four-period analytics to every individual tracking link.
- Replaced generated `/go/[slug]` URLs with short root URLs such as `/tg`.
- Kept `/go/[slug]` working for backward compatibility with already published links.
- Moved aggregate calculations into Supabase/PostgreSQL views.
- Added country code to click records using Vercel geolocation headers.
- Removed `referrer` from stored click records and the database schema.
- Added click detail rows with anonymous visitor ID, time, country, source link, destination, and device type.
- Added reserved root slugs to avoid collisions with TrackLink system routes.
- Updated the application version to `v0.2.0`.

### Українська

- Додано блок стану `System / Database`.
- Верхню статистику перероблено на чотири періоди: сьогодні, останні 7 днів, поточний місяць і весь час.
- У кожному блоці додано показники `Унікальні` та `Всього переходів`.
- Блоки періодів зроблено клікабельними; після натискання відкриваються відповідні записи переходів.
- Таку саму статистику за чотири періоди додано для кожного окремого посилання.
- Згенеровані URL змінено з `/go/[slug]` на короткі кореневі URL на кшталт `/tg`.
- Старі `/go/[slug]` залишено робочими для сумісності з уже опублікованими посиланнями.
- Агреговані розрахунки перенесено у Supabase/PostgreSQL views.
- До запису переходу додано код країни через геолокаційні headers Vercel.
- Поле `referrer` видалено із записів переходів і схеми бази даних.
- У деталях переходів показуються анонімний ID відвідувача, час, країна, посилання-джерело, кінцева адреса та тип пристрою.
- Додано зарезервовані slug для захисту системних маршрутів TrackLink.
- Версію застосунку оновлено до `v0.2.0`.

**Commit:** `feat: add period analytics and short tracking URLs`  
**Release tag:** `v0.2.0`

---

## v0.1.4 — Documentation structure update

### English

- Made `README.md` the primary English README for GitHub.
- Kept the Ukrainian documentation in `README.ua.md`.
- Removed the duplicate `README.en.md` file.
- Merged the separate English and Ukrainian changelogs into one bilingual `PATCHLIST.md`.
- Added direct links between the main README, Ukrainian README, and patch list.
- Updated the application version to `v0.1.4`.

### Українська

- `README.md` зроблено основним англомовним README для GitHub.
- Українську документацію залишено в `README.ua.md`.
- Видалено дублюючий файл `README.en.md`.
- Окремі англійський та український changelog об'єднано в один двомовний `PATCHLIST.md`.
- Додано прямі посилання між основним README, українським README та патчлістом.
- Версію застосунку оновлено до `v0.1.4`.

**Commit:** `docs: simplify documentation structure`  
**Release tag:** `v0.1.4`

---

## v0.1.3 — Admin diagnostics fix and password visibility

### English

- Added a show/hide password button on the login page.
- Supabase errors are no longer thrown into the UI as raw JavaScript objects.
- Added a readable database diagnostics panel.
- Added validation to prevent using an `sb_publishable_...` key as `SUPABASE_SECRET_KEY`.
- Documented browser-extension hydration mismatch troubleshooting.
- Updated the application version to `v0.1.3`.

### Українська

- Додано кнопку показу/приховування пароля на сторінці входу.
- Supabase-помилки більше не виводяться в інтерфейс як сирий JavaScript-об'єкт.
- Додано зрозумілий діагностичний блок при проблемах з базою.
- Додано перевірку, щоб `sb_publishable_...` не використовувався як `SUPABASE_SECRET_KEY`.
- Додано інструкцію щодо hydration mismatch, який можуть спричиняти розширення браузера.
- Версію застосунку оновлено до `v0.1.3`.

**Commit:** `fix: improve admin diagnostics and password visibility`  
**Release tag:** `v0.1.3`

---

## v0.1.2 — TrackLink rename

### English

- Renamed the project from `Transition Tracker` to `TrackLink`.
- Updated the app title and metadata.
- Updated the package name to `tracklink`.
- Updated internal admin cookie/session identifiers.
- Updated English and Ukrainian documentation for the new project name.

### Українська

- Проєкт перейменовано з `Transition Tracker` на `TrackLink`.
- Оновлено назву в інтерфейсі та metadata.
- Package name змінено на `tracklink`.
- Оновлено внутрішні ідентифікатори admin cookie/session.
- Англійську та українську документацію оновлено під нову назву.

**Commit:** `chore: rename project to TrackLink`  
**Release tag:** `v0.1.2`

---

## v0.1.1 — UI contrast and documentation update

### English

- Simplified the login screen.
- Made the project name the main login title.
- Improved dashboard contrast.
- Made link cards more visually distinct.
- Added visible app version metadata.
- Added English and Ukrainian README files.
- Added English and Ukrainian changelogs.

### Українська

- Спрощено сторінку входу.
- Назву проєкту зроблено головним заголовком на екрані входу.
- Покращено контрастність робочого середовища.
- Блоки посилань зроблено більш виразними.
- Додано відображення версії додатку.
- Додано README англійською та українською.
- Додано патчлісти англійською та українською.

**Commit:** `style: improve admin UI contrast`  
**Release tag:** `v0.1.1`

---

## v0.1.0 — Initial MVP release

### English

- Created redirect tracking through `/go/[slug]`.
- Added a password-protected admin area.
- Added link creation, editing, deletion, enable and disable actions.
- Added total clicks, unique visitors, 24-hour and 7-day stats.
- Added a 14-day chart.
- Added preview-bot filtering.
- Added the Supabase schema and deployment-ready project structure.

### Українська

- Створено трекер переходів через `/go/[slug]`.
- Додано захищену паролем адмінку.
- Додано створення, редагування, видалення, увімкнення та вимкнення посилань.
- Додано загальні переходи, унікальних відвідувачів, статистику за 24 години та 7 днів.
- Додано графік за 14 днів.
- Додано фільтрацію preview-ботів.
- Додано схему Supabase та структуру проєкту для деплою.

**Commit:** `feat: create initial link tracking MVP`  
**Release tag:** `v0.1.0`
