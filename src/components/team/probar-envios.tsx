"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BellRing, CheckCircle2, Clock, Mail, XCircle } from "lucide-react";
import { estadoNotificacion, probarCorreo, probarNotificacion } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PruebaCorreo, Usuario } from "@/lib/types";

type Resultado =
  | { tipo: "correo"; r: PruebaCorreo }
  | { tipo: "push"; estado: "esperando" | "enviado" | "fallido" | "demora"; detalle?: string | null }
  | { tipo: "error"; mensaje: string };

const ESPERA_MAX_MS = 30_000;

/**
 * Pruebas de envío a alguien del equipo (solo admin): un correo directo, que
 * muestra lo que contestó el servidor de correo, y un aviso al celular, que se
 * sigue hasta que sale o falla. Sirven para descartar problemas del panel
 * cuando alguien dice "no me llegan los correos / las notificaciones".
 */
export function ProbarEnvios({ usuario }: { usuario: Usuario }) {
  const [pending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const sondeo = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (sondeo.current) clearInterval(sondeo.current);
  }, []);

  function mostrar(r: Resultado) {
    setResultado(r);
    setAbierto(true);
  }

  function correo() {
    startTransition(async () => {
      const { resultado: r, error } = await probarCorreo(usuario.id);
      mostrar(r ? { tipo: "correo", r } : { tipo: "error", mensaje: error ?? "Error desconocido." });
    });
  }

  function notificacion() {
    startTransition(async () => {
      const { envioId, error } = await probarNotificacion(usuario.id);
      if (!envioId) {
        mostrar({ tipo: "error", mensaje: error ?? "Error desconocido." });
        return;
      }
      mostrar({ tipo: "push", estado: "esperando" });
      const inicio = Date.now();
      if (sondeo.current) clearInterval(sondeo.current);
      sondeo.current = setInterval(async () => {
        const r = await estadoNotificacion(envioId);
        const terminado = r.estado === "enviado" || r.estado === "fallido";
        if (terminado || r.error || Date.now() - inicio > ESPERA_MAX_MS) {
          if (sondeo.current) clearInterval(sondeo.current);
          sondeo.current = null;
          if (r.error) setResultado({ tipo: "error", mensaje: r.error });
          else if (r.estado === "enviado") setResultado({ tipo: "push", estado: "enviado" });
          else if (r.estado === "fallido") setResultado({ tipo: "push", estado: "fallido", detalle: r.detalle });
          else setResultado({ tipo: "push", estado: "demora", detalle: r.detalle });
        }
      }, 2_000);
    });
  }

  const nombre = usuario.nombre.split(" ")[0] || usuario.nombre;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={correo}>
          <Mail />
          Probar correo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || !usuario.push_activo}
          title={usuario.push_activo ? undefined : "No tiene la app instalada con las notificaciones activas"}
          onClick={notificacion}
        >
          <BellRing />
          Probar notificación
        </Button>
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          {resultado?.tipo === "correo" && <ResultadoCorreo r={resultado.r} nombre={nombre} />}
          {resultado?.tipo === "push" && (
            <ResultadoPush estado={resultado.estado} detalle={resultado.detalle} nombre={nombre} />
          )}
          {resultado?.tipo === "error" && (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="size-5 text-destructive" />
                No se pudo hacer la prueba
              </DialogTitle>
              <DialogDescription>{resultado.mensaje}</DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResultadoCorreo({ r, nombre }: { r: PruebaCorreo; nombre: string }) {
  if (r.modo === "consola") {
    return (
      <DialogHeader>
        <DialogTitle>Sin servidor de correo</DialogTitle>
        <DialogDescription>
          Este entorno no tiene servidor de correo configurado: el correo solo se mostró en la consola del
          backend. En producción sale por Resend.
        </DialogDescription>
      </DialogHeader>
    );
  }
  if (!r.ok) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="size-5 text-destructive" />
            El servidor de correo no lo aceptó
          </DialogTitle>
          <DialogDescription>
            El problema está de nuestro lado o en la dirección {r.destinatario}, no en la casilla de {nombre}.
          </DialogDescription>
        </DialogHeader>
        <p className="bg-muted p-3 font-mono text-xs break-all">
          {r.error ?? `Rechazado: ${r.rechazados.join(", ")}`}
        </p>
      </>
    );
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          Correo enviado
        </DialogTitle>
        <DialogDescription>
          El servidor de correo aceptó el envío a <strong>{r.destinatario}</strong>.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 text-sm">
        <p>
          Pedile a {nombre} que busque el código <strong className="font-mono text-base">{r.codigo}</strong> en
          su casilla, incluidas las carpetas <strong>Spam</strong> y <strong>Promociones</strong>.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Si le llegó: los correos del panel funcionan para su cuenta.</li>
          <li>
            Si no aparece en unos minutos: el envío salió bien de nuestro lado. Buscá su dirección en Resend →
            Emails: ahí figura si se entregó, rebotó o está bloqueada.
          </li>
        </ul>
        {(r.respuesta || r.message_id) && (
          <p className="bg-muted p-3 font-mono text-xs break-all text-muted-foreground">
            {r.respuesta}
            {r.message_id ? ` · ${r.message_id}` : ""}
          </p>
        )}
      </div>
    </>
  );
}

function ResultadoPush({
  estado,
  detalle,
  nombre,
}: {
  estado: "esperando" | "enviado" | "fallido" | "demora";
  detalle?: string | null;
  nombre: string;
}) {
  if (estado === "esperando") {
    return (
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Clock className="size-5 animate-pulse text-muted-foreground" />
          Enviando el aviso…
        </DialogTitle>
        <DialogDescription>Suele tardar unos segundos.</DialogDescription>
      </DialogHeader>
    );
  }
  if (estado === "enviado") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            Aviso enviado
          </DialogTitle>
          <DialogDescription>
            El servicio de notificaciones del celular de {nombre} lo recibió.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Si no le apareció, que revise en los ajustes del celular que las notificaciones de Lamelas estén
          permitidas y que no tenga activado el modo No molestar.
        </p>
      </>
    );
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <XCircle className="size-5 text-destructive" />
          {estado === "fallido" ? "El aviso no salió" : "El aviso sigue en cola"}
        </DialogTitle>
        <DialogDescription>
          {estado === "fallido"
            ? `Puede que ${nombre} haya desinstalado la app o quitado el permiso: que vuelva a activar las notificaciones desde Mi perfil.`
            : "Pasaron 30 segundos sin respuesta. Revisá el log del backend ([push])."}
        </DialogDescription>
      </DialogHeader>
      {detalle && <p className="bg-muted p-3 font-mono text-xs break-all">{detalle}</p>}
    </>
  );
}
