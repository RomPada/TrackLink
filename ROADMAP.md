# TrackLink — Development Roadmap / План розвитку

This is an approximate development plan. Priorities and implementation details may change as TrackLink evolves.  
Це орієнтовний план розвитку. Пріоритети та деталі реалізації можуть змінюватися в міру розвитку TrackLink.

---

## 1. Archive instead of destructive deletion / Архів замість видалення

**English:** Replace direct deletion of links and groups with `Active / Paused / Archived` states so historical analytics cannot be lost accidentally.  
**Українська:** Замінити пряме видалення посилань і груп станами `Active / Paused / Archived`, щоб історична статистика не губилася випадково.

## 2. Click-detail filters / Фільтри деталізації переходів

Filters by country, group, link, `visitor_id`, and period.  
Фільтри за країною, групою, посиланням, `visitor_id` та періодом.

## 3. Link search and sorting / Пошук і сортування посилань

Search by name or slug and sort by most clicks, newest, name, or group.  
Пошук за назвою або slug і сортування за кількістю переходів, датою створення, назвою або групою.

## 4. CSV / Excel export

Export the current period with: `date`, `time`, `link`, `group`, `country`, `visitor_id`, `destination`.

## 5. Country analytics / Аналітика по країнах

Country shares and counts for all TrackLink traffic, each group, and each individual link.  
Частки й кількість переходів за країнами для всього TrackLink, груп і конкретних посилань.

## 6. Repeat visitors / Повторні переходи

Add repeat clicks alongside total and unique counts, for example `1000 total / 730 unique / 270 repeat`.  
Додати повторні переходи поруч із загальною кількістю та унікальними відвідувачами.

## 7. Dedicated link dashboard / Детальна сторінка посилання

A separate dashboard per link with chart, four time periods, countries, recent clicks, and destination history.  
Окрема сторінка для кожного посилання з графіком, чотирма періодами, країнами, останніми переходами та історією destination.

## 8. Destination URL history / Історія destination URL

Track which destination was active during each date range, for example `01.10–31.10 → Patreon`, `01.11–… → Shop`.

## 9. Activation and expiration dates / Дата активації та завершення

Allow `Active from` and `Expires` values, then automatically move expired links to `Paused`.

## 10. Fallback URL

Redirect paused or expired links to a configured fallback instead of showing a technical error.

## 11. QR codes

Generate a QR code for every tracking link, for example `QR → brand.link/event`.

## 12. Custom domain section

Add `Primary tracking domain: brand.link` and generate displayed URLs using that domain even when DNS setup is handled manually.

## 13. Alerts and notifications / Сповіщення

Examples: milestone reached, no clicks for 7 days, or unusual traffic spike detected.

## 14. Suspicious traffic detection / Антинакрутка

Flag unusual activity instead of aggressively blocking it, for example `50 clicks from one visitor_id in 20 seconds → suspicious`, with `Valid / Suspicious` counters.

## 15. Retention policy

Keep detailed click records for configurable periods such as 6 / 12 / 24 months, while preserving older aggregate daily statistics.

## 16. Aggregated statistics tables / Агреговані таблиці статистики

Introduce scalable tables such as `daily_link_stats`, `group_stats`, and `overall_stats` so dashboards do not repeatedly scan the entire `clicks` table.

## 17. Conversion tracking / Відстеження конверсій

Move from click-only analytics to conversion funnels, for example `Instagram → 1200 clicks → 58 conversions → 4.8%`.

## 18. Campaigns above groups / Кампанії поверх груп

Keep groups as destinations/directions such as `Patreon / GitHub / YouTube`, and add campaigns such as `October Launch` that can contain links from multiple groups.
