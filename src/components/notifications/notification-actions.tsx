"use client";

import { useTransition } from "react";
import { Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const error = await markNotificationRead(id);
          if (error) toast.error(error);
        })
      }
    >
      <Check /> {pending ? "Marcando..." : "Marcar como leída"}
    </Button>
  );
}

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const error = await markAllNotificationsRead();
          if (error) toast.error(error);
          else toast.success("Todas marcadas como leídas");
        })
      }
    >
      <CheckCheck /> {pending ? "Marcando..." : "Marcar todas como leídas"}
    </Button>
  );
}
