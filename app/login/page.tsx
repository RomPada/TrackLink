import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { isAdmin } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (await isAdmin()) redirect("/admin");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="eyebrow">Transition Tracker</div>
        <h1>Вхід в адмінку</h1>
        <p className="muted">Введи пароль, який ти задаси у змінній ADMIN_PASSWORD.</p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form action={loginAction} className="stack">
          <label>
            Пароль
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button button-primary" type="submit">
            Увійти
          </button>
        </form>
      </section>
    </main>
  );
}
