"use client";

import { useState, useEffect } from "react";

type CertMap = Record<string, string>;

type CertsState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; certs: CertMap; selected: string };

type SignState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; downloadUrl: string; filename: string }
  | { kind: "error"; message: string };

export default function FirmarPage() {
  const [certsState, setCertsState] = useState<CertsState>({ kind: "loading" });
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [signState, setSignState] = useState<SignState>({ kind: "idle" });

  useEffect(() => {
    fetch("/api/solicitudes")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/?error=session_expired";
          return;
        }
        if (!res.ok) throw new Error("Error al cargar certificados");
        const data: CertMap = await res.json();
        const ids = Object.keys(data);
        if (ids.length === 0) throw new Error("No tenés certificados disponibles");
        setCertsState({ kind: "ready", certs: data, selected: ids[0] });
      })
      .catch((err: Error) => setCertsState({ kind: "error", message: err.message }));
  }, []);

  useEffect(() => {
    if (signState.kind !== "success") return;
    const a = document.createElement("a");
    a.href = signState.downloadUrl;
    a.download = signState.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    const url = signState.downloadUrl;
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [signState]);

  async function handleSign() {
    if (!file || certsState.kind !== "ready") return;
    setSignState({ kind: "loading" });

    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("password", password);
    formData.append("solicitudId", certsState.selected);

    try {
      const res = await fetch("/api/firmar", { method: "POST", body: formData });

      if (res.status === 401) {
        window.location.href = "/?error=session_expired";
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error desconocido" })) as { message?: string };
        setSignState({ kind: "error", message: err.message ?? "Error al firmar el documento." });
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const filename = match?.[1] ?? "documento_firmado.pdf";
      setSignState({ kind: "success", downloadUrl: URL.createObjectURL(blob), filename });
    } catch {
      setSignState({ kind: "error", message: "Error de red. Verificá tu conexión e intentá de nuevo." });
    }
  }

  const certEntries = certsState.kind === "ready" ? Object.entries(certsState.certs) : [];
  const isReady = certsState.kind === "ready";

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8">
        <a href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          ← Volver
        </a>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Firmar documento</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sesión activa. Subí un PDF y firmalo con tu certificado Lakaut.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">

        {/* Selector de certificado */}
        {certsState.kind === "loading" && (
          <p className="text-sm text-slate-400">Cargando certificados...</p>
        )}

        {certsState.kind === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{certsState.message}</p>
          </div>
        )}

        {certsState.kind === "ready" && certEntries.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Certificado</label>
            <select
              value={certsState.selected}
              onChange={(e) => setCertsState({ ...certsState, selected: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {certEntries.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {certsState.kind === "ready" && certEntries.length === 1 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Certificado</label>
            <p className="text-sm text-slate-700">{certEntries[0][1]}</p>
          </div>
        )}

        {/* Archivo */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Documento PDF</label>
          <label
            className={`flex flex-col items-center justify-center w-full px-6 py-8 border border-dashed rounded-xl cursor-pointer transition-all ${
              file ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-blue-400 bg-slate-50"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setSignState({ kind: "idle" });
              }}
              className="hidden"
            />
            <span className={`text-sm font-medium ${file ? "text-emerald-700" : "text-slate-500"}`}>
              {file ? `✓ ${file.name}` : "Seleccioná un archivo PDF"}
            </span>
          </label>
        </div>

        {/* PIN */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">PIN del certificado</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <button
          onClick={handleSign}
          disabled={!file || !isReady || signState.kind === "loading"}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95"
        >
          {signState.kind === "loading" ? "Firmando..." : "Firmar PDF"}
        </button>

        {signState.kind === "success" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <p className="text-sm font-medium text-emerald-800">✓ Documento firmado correctamente</p>
            <a
              href={signState.downloadUrl}
              download={signState.filename}
              className="flex items-center justify-center w-full rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Descargar PDF firmado
            </a>
            <p className="text-xs text-emerald-600 text-center">
              Si no inició la descarga automáticamente, usá este botón.
            </p>
          </div>
        )}

        {signState.kind === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{signState.message}</p>
          </div>
        )}
      </div>
    </main>
  );
}
