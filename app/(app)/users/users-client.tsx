"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Plus, UserPlus, KeyRound, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel } from "@/lib/labels";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { createUser, updateUser, setUserActive, resetPassword } from "./actions";

type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: "operator" | "admin";
  active: boolean;
  createdAt: string;
};

const ROLE_OPTS = [
  { value: "operator", label: "Operador" },
  { value: "admin", label: "Administrador" },
];

export function UsersClient({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [dialog, setDialog] = useState<
    { type: "create" } | { type: "edit" | "reset"; user: UserRow } | null
  >(null);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" data-press onClick={() => setDialog({ type: "create" })}>
          <Plus className="size-3.5" />
          Nuevo usuario
        </Button>
      </div>

      <div className="rise-in border border-border rounded-xl overflow-hidden bg-card elevated">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.1em] text-ink-faint border-b border-border">
                <th className="text-left font-semibold px-4 py-3.5">Usuario</th>
                <th className="text-left font-semibold px-4 py-3.5">Nombre</th>
                <th className="text-left font-semibold px-4 py-3.5">Rol</th>
                <th className="text-left font-semibold px-4 py-3.5">Estado</th>
                <th className="text-left font-semibold px-4 py-3.5">Creado</th>
                <th className="w-10 px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "border-t border-border/70 first:border-t-0 hover:bg-accent/60 transition-colors",
                    !u.active && "opacity-55",
                  )}
                >
                  <td className="px-4 py-3 align-middle">
                    <span className="font-data text-[13.5px] text-ink">
                      @{u.username}
                    </span>
                    {u.id === currentUserId && (
                      <span className="ml-2 text-[10.5px] uppercase tracking-wider text-primary/70">
                        · tú
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle text-ink">{u.fullName}</td>
                  <td className="px-4 py-3 align-middle">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[12.5px]",
                        u.active ? "text-tag-svc-foreground" : "text-ink-faint",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          u.active ? "bg-tag-svc-foreground" : "bg-ink-faint",
                        )}
                      />
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-ink-muted text-[13px] tnum">
                    {formatDate(new Date(u.createdAt))}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <RowMenu
                      user={u}
                      isSelf={u.id === currentUserId}
                      onEdit={() => setDialog({ type: "edit", user: u })}
                      onReset={() => setDialog({ type: "reset", user: u })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dialog?.type === "create" && (
        <UserFormDialog onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "edit" && (
        <UserFormDialog user={dialog.user} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "reset" && (
        <ResetDialog user={dialog.user} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: "operator" | "admin" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium",
        role === "admin"
          ? "bg-primary/10 text-primary"
          : "bg-accent text-ink-muted",
      )}
    >
      {roleLabel[role]}
    </span>
  );
}

function RowMenu({
  user,
  isSelf,
  onEdit,
  onReset,
}: {
  user: UserRow;
  isSelf: boolean;
  onEdit: () => void;
  onReset: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const r = await setUserActive(user.id, !user.active);
      if (r.ok) {
        toast.success(user.active ? "Usuario desactivado" : "Usuario activado");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            data-press
            disabled={isPending}
            aria-label="Acciones"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReset}>
          <KeyRound className="size-4" />
          Resetear contraseña
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={toggleActive}
          disabled={isSelf}
          variant={user.active ? "destructive" : "default"}
        >
          <Power className="size-4" />
          {user.active ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserFormDialog({
  user,
  onClose,
}: {
  user?: UserRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = !!user;

  const [username, setUsername] = useState(user?.username ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [role, setRole] = useState<string>(user?.role ?? "operator");
  const [password, setPassword] = useState("");

  function submit() {
    startTransition(async () => {
      const r = editing
        ? await updateUser(user!.id, { fullName, role })
        : await createUser({ username, fullName, role, password });
      if (r.ok) {
        toast.success(editing ? "Usuario actualizado" : "Usuario creado");
        onClose();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            Administración · Usuario
          </p>
          <DialogTitle className="font-display text-[18px]">
            {editing ? "Editar usuario" : "Nuevo usuario"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <Small label="Usuario *">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={editing}
              autoCapitalize="off"
              autoComplete="off"
              className="font-data"
              placeholder="ej. jperez"
            />
            {editing && (
              <p className="text-[11.5px] text-ink-faint">
                El nombre de usuario no se puede cambiar.
              </p>
            )}
          </Small>
          <Small label="Nombre completo *">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </Small>
          <Small label="Rol *">
            <Select items={ROLE_OPTS} value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger data-press>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Small>
          {!editing && (
            <Small label="Contraseña inicial *">
              <PasswordField value={password} onChange={setPassword} />
            </Small>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending} data-press>
            Cancelar
          </Button>
          <Button size="sm" onClick={submit} disabled={isPending} data-press>
            {isPending ? "Guardando…" : editing ? "Guardar" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");

  function submit() {
    startTransition(async () => {
      const r = await resetPassword(user.id, password);
      if (r.ok) {
        toast.success("Contraseña restablecida");
        onClose();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            Administración · Contraseña
          </p>
          <DialogTitle className="font-display text-[18px]">
            Resetear contraseña
          </DialogTitle>
        </DialogHeader>
        <p className="text-[12.5px] text-ink-muted">
          Define una nueva contraseña para{" "}
          <span className="font-data text-ink">@{user.username}</span> y compártela
          con la persona.
        </p>
        <div className="py-1">
          <Small label="Nueva contraseña *">
            <PasswordField value={password} onChange={setPassword} />
          </Small>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending} data-press>
            Cancelar
          </Button>
          <Button size="sm" onClick={submit} disabled={isPending} data-press>
            {isPending ? "Guardando…" : "Restablecer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  function generate() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    const arr = new Uint32Array(10);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 10; i++) out += chars[arr[i] % chars.length];
    onChange(out);
  }
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-data"
        placeholder="Mínimo 6 caracteres"
        autoComplete="new-password"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-press
        onClick={generate}
        className="shrink-0"
      >
        <UserPlus className="size-3.5" />
        Generar
      </Button>
    </div>
  );
}

function Small({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11.5px] uppercase tracking-[0.12em] text-ink-muted font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
