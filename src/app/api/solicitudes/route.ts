import { cookies } from "next/headers";

const LAKAUT_URL = process.env.NEXT_PUBLIC_LAKAUT_URL ?? "https://web-preprod.lakautac.com.ar";

export async function GET() {
  const token = cookies().get("lakaut_token")?.value;

  if (!token) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const res = await fetch(`${LAKAUT_URL}/api/legacy-solicitudes/solicitudes`, {
    headers: { Cookie: `legacy_solicitudes_access_token=${token}` },
  });

  if (res.status === 401) {
    cookies().delete("lakaut_token");
    return Response.json({ error: "Sesión expirada" }, { status: 401 });
  }

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
