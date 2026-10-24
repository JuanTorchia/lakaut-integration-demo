import { headers } from "next/headers";

async function getAppUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const lakautUrl = process.env.NEXT_PUBLIC_LAKAUT_URL ?? "https://web-preprod.lakautac.com.ar";
  const appUrl = await getAppUrl();
  const callbackUrl = `${appUrl}/callback`;
  const bridgeUrl = `${lakautUrl}/bridge?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-medium tracking-widest text-slate-400 uppercase">Lakaut · Demo</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Firma digital</h1>
        <p className="mt-3 text-slate-500 leading-relaxed">
          Demo funcional del flujo de integración con Lakaut. El usuario se autentica en Lakaut y vuelve a esta
          aplicación con sesión activa para firmar documentos PDF.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "no_token"
            ? "La autenticación no se completó. Intentá de nuevo."
            : "Sesión expirada. Volvé a autenticarte."}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <ol className="space-y-3">
          {[
            "Hacés click en el botón — te lleva a Lakaut",
            "Lakaut resuelve login y OTP",
            "Volvés a esta app con sesión activa",
            "Subís tu PDF, ingresás tu PIN y firmás",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-slate-600">{step}</p>
            </li>
          ))}
        </ol>

        <a
          href={bridgeUrl}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Iniciar sesión con Lakaut
        </a>

        <p className="text-xs text-slate-400 text-center break-all">
          Callback: <code className="font-mono">{callbackUrl}</code>
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        Entorno:{" "}
        <code className="font-mono">{lakautUrl}</code>
      </p>
    </main>
  );
}
