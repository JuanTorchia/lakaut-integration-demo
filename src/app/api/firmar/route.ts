import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const LAKAUT_URL = process.env.NEXT_PUBLIC_LAKAUT_URL ?? "https://web-preprod.lakautac.com.ar";

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("lakaut_token")?.value;

  if (!token) {
    return Response.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();

  const res = await fetch(`${LAKAUT_URL}/api/legacy-solicitudes/firmar-simple`, {
    method: "POST",
    headers: { Cookie: `legacy_solicitudes_access_token=${token}` },
    body: formData,
  });

  if (res.status === 401) {
    (await cookies()).delete("lakaut_token");
    return Response.json({ message: "Sesión expirada" }, { status: 401 });
  }

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const err = await res.json();
      return Response.json(err, { status: res.status });
    }
    return Response.json({ message: "Error al firmar el documento" }, { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/pdf";
  const contentDisposition = res.headers.get("content-disposition") ?? 'attachment; filename="documento_firmado.pdf"';

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
  });
}
