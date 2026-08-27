"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlugZap, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  completarConexion,
  desconectarCanal,
  obtenerUrlDeConexion,
  verificarCanal,
} from "@/actions/channels";
import { formatDate } from "@/lib/utils";
import type { ChannelAccount, ChannelEstado } from "@/lib/types";

const ESTADO_LABEL: Record<ChannelEstado, string> = {
  activa: "Conectado",
  desconectada: "Desconectado",
  error: "Con problemas",
};

/**
 * El badge de estado de propiedad usa CSS vars propias; acá alcanza con las
 * variantes del badge base. `error` no tiene variante destructiva (el badge
 * del repo no la trae), así que se pinta con el color del texto.
 */
function EstadoBadge({ estado }: { estado: ChannelEstado }) {
  if (estado === "activa") return <Badge>{ESTADO_LABEL.activa}</Badge>;
  if (estado === "desconectada") return <Badge variant="secondary">{ESTADO_LABEL.desconectada}</Badge>;
  return (
    <Badge variant="outline" className="border-destructive/40 text-destructive">
      {ESTADO_LABEL.error}
    </Badge>
  );
}

function BotonConectar() {
  const [pendiente, startTransition] = useTransition();

  function conectar() {
    startTransition(async () => {
      const { url, error } = await obtenerUrlDeConexion("whatsapp");
      if (error || !url) {
        toast.error(error ?? "Zernio no devolvió una URL de conexión.");
        return;
      }
      // Navegación completa a Meta (no popup): el flujo de Embedded Signup pide
      // pantalla entera y en el celular un popup es directamente inusable.
      window.location.assign(url);
    });
  }

  return (
    <Button onClick={conectar} disabled={pendiente}>
      <PlugZap />
      {pendiente ? "Abriendo…" : "Conectar WhatsApp"}
    </Button>
  );
}

function AccionesCuenta({ cuenta }: { cuenta: ChannelAccount }) {
  const [pendiente, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function verificar() {
    startTransition(async () => {
      const { error } = await verificarCanal(cuenta.id);
      if (error) toast.error(error);
      else toast.success("El número responde bien.");
    });
  }

  function desconectar() {
    startTransition(async () => {
      const error = await desconectarCanal(cuenta.id);
      if (error) toast.error(error);
      else toast.success("Número desconectado.");
      setConfirmando(false);
    });
  }

  if (cuenta.estado !== "activa") {
    return <span className="text-sm text-muted-foreground">Sin acciones</span>;
  }

  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={verificar} disabled={pendiente}>
        <RefreshCw /> <span className="sr-only sm:not-sr-only">Verificar</span>
      </Button>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" disabled={pendiente}>
            <Unplug /> <span className="sr-only sm:not-sr-only">Desconectar</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desconectar este número?</AlertDialogTitle>
            <AlertDialogDescription>
              Sofi deja de recibir y de contestar los mensajes que lleguen a{" "}
              {cuenta.display_phone ?? "este número"}. Las conversaciones ya
              guardadas no se borran. Para volver a activarlo hay que rehacer la
              autorización con Meta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={desconectar} disabled={pendiente}>
              {pendiente ? "Desconectando…" : "Desconectar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ChannelManager({ cuentas }: { cuentas: ChannelAccount[] }) {
  const router = useRouter();
  const recuperacionIniciada = useRef(false);
  const [, startRecovery] = useTransition();
  const activas = cuentas.filter((c) => c.estado === "activa").length;
  const hayActiva = activas > 0;

  // Facebook puede volver al tab original con #_=_ en vez de navegar al
  // redirect_url de Zernio. Si todavía no hay fila local, completamos contra
  // la cuenta activa del profile y dejamos la URL limpia.
  useEffect(() => {
    if (cuentas.length > 0 || window.location.hash !== "#_=_" || recuperacionIniciada.current) {
      return;
    }
    recuperacionIniciada.current = true;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    startRecovery(async () => {
      const { error } = await completarConexion("whatsapp");
      if (error) toast.error(error);
      else {
        toast.success("Número conectado correctamente.");
        router.refresh();
      }
    });
  }, [cuentas.length, router]);

  return (
    <section className="border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <WhatsappIcon className="size-5 text-primary" />
          <h2 className="font-semibold">Números conectados ({activas})</h2>
        </div>
        {hayActiva ? (
          <p className="text-xs text-muted-foreground">
            Para cambiar de número, desconectá el actual primero.
          </p>
        ) : (
          <BotonConectar />
        )}
      </div>

      {cuentas.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Todavía no hay ningún número conectado. Sin uno, Sofi no recibe
          mensajes de WhatsApp.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Nombre en WhatsApp</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Conectado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cuentas.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="min-w-[10rem] font-medium">
                  {c.display_phone ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.display_name ?? "—"}
                </TableCell>
                <TableCell>
                  <EstadoBadge estado={c.estado} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(c.creada_at)}
                </TableCell>
                <TableCell className="text-right">
                  <AccionesCuenta cuenta={c} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
