import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PasswordField from "@/components/PasswordField";
import { isAdmin } from "@/lib/auth";
import { APP_NAME, APP_VERSION } from "@/lib/app-meta";
import { translations } from "@/lib/i18n";
import { getLanguage } from "@/lib/language";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (await isAdmin()) redirect("/admin");

  const [params, language] = await Promise.all([searchParams, getLanguage()]);
  const text = translations[language];
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-language-switcher">
          <LanguageSwitcher language={language} />
        </div>
        <h1>{APP_NAME}</h1>
        <p className="muted auth-version">{APP_VERSION}</p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form action={loginAction} className="stack">
          <label>
            {text.login.password}
            <PasswordField language={language} />
          </label>
          <button className="button button-primary" type="submit">
            {text.login.signIn}
          </button>
          <a className="button button-ghost demo-login-button" href="/demo">
            {text.login.openDemo}
          </a>
        </form>
      </section>
    </main>
  );
}
