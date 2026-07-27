"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { revokeInvitation } from "@/actions/team";

export function RevokeInvitationButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`Cancelar la invitación de ${email}`}
      onClick={() =>
        startTransition(async () => {
          const error = await revokeInvitation(id);
          if (error) toast.error(error);
          else toast.success("Invitación cancelada");
        })
      }
    >
      <X /> Cancelar
    </Button>
  );
}
