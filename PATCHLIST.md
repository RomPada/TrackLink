# TrackLink — Patch List / Список змін

This file is maintained for every release in English and Ukrainian.  
Цей файл оновлюється для кожної версії англійською та українською мовами.

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

**Commit:** `v0.1.4 simplify documentation structure`

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

**Commit:** `v0.1.3 fix admin errors and add password toggle`

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

**Commit:** `v0.1.2 rename project to TrackLink`

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

**Commit:** `v0.1.1 improve admin UI and docs`

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

**Commit:** `v0.1.0 initial MVP release`
