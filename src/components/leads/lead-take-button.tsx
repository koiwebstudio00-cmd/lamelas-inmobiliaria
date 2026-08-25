"use client";

import { useTransition } from "react";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { takeLead } from "@/actions/leads";
import { Button } from "@/components/ui/button";

export function LeadTakeButton({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const error = await takeLead(leadId);
          if (error) toast.error(error);
          else toast.success("Consulta tomada");
        });
      }}
    >
      <UserCheck /> {pending ? "Tomando..." : "Tomar lead"}
    </Button>
  );
}
