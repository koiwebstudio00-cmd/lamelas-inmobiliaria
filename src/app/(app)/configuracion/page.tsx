import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { RevokeApiKeyButton } from "@/components/settings/revoke-api-key-button";
import { getCurrentUser } from "@/lib/api";
import { getApiKeys } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Configuración — Lamelas & Chaumont" };

export default async function ConfiguracionPage() {
  const me = await getCurrentUser();
  if (!me || (me.rol !== "admin" && me.rol !== "super_admin")) redirect("/");

  const keys = await getApiKeys();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Las keys que usa el sitio público para leer las propiedades.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 border-b bg-muted/40 py-3">
          <KeyRound className="size-5 text-primary" />
          <CardTitle className="text-base">Nueva key</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ApiKeyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/40 py-3">
          <CardTitle className="text-base">Keys activas ({keys.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {keys.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No hay ninguna key activa. Sin una, el sitio público no puede leer
              las propiedades.
            </p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-2 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{k.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    <code className="font-mono">{k.prefix}…</code> · creada el{" "}
                    {formatDate(k.created_at)} ·{" "}
                    {k.last_used_at
                      ? `usada por última vez el ${formatDate(k.last_used_at)}`
                      : "todavía sin usar"}
                  </p>
                </div>
                <RevokeApiKeyButton id={k.id} nombre={k.nombre} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Estas keys son de solo lectura y solo ven las propiedades de la
        inmobiliaria: pueden viajar en el código del sitio público. Nunca uses
        acá una contraseña ni compartas tu sesión del panel.
      </p>
    </div>
  );
}
