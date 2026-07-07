import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-6 flex items-center gap-2">
        <Logo className="size-10" />
        <span className="text-xl font-semibold">Lamelas & Chaumont</span>
      </div>
      <div className="w-full max-w-sm border bg-background p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
