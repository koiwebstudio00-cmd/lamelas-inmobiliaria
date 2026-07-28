"use client";

import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import type { ScopeOption } from "@/lib/types";

export function ApiKeyDialog({ scopes }: { scopes: ScopeOption[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <KeyRound /> Crear Nueva Api Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva API key</DialogTitle>
          <DialogDescription>
            Creá una credencial para el sitio público o para el agente de IA.
          </DialogDescription>
        </DialogHeader>
        <ApiKeyForm scopes={scopes} />
      </DialogContent>
    </Dialog>
  );
}
