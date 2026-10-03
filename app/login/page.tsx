import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import PasswordField from "@/components/PasswordField";
import { isAdmin } from "@/lib/auth";
import { APP_NAME, APP_VERSION } from "@/lib/app-meta";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (await isAdmin()) redirect("/admin");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>{APP_NAME}</h1>
        <p className="muted auth-version">{APP_VERSION}</p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form action={loginAction} className="stack">
          <label>
            Пароль
            <PasswordField />
          </label>
          <button className="button button-primary" type="submit">
            Увійти
          </button>
          <a className="button button-ghost demo-login-button" href="/demo">
            Відкрити демо
          </a>
        </form>
      </section>
    </main>
  );
}
