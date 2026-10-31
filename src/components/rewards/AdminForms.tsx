import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  saveReward,
  savePartner,
  addRewardCodes,
  processReward,
  getAdminDelivery,
} from "@/lib/rewards-admin.functions";
import {
  PartnerSchema,
  RewardSchema,
  ProcessSchema,
  rewardCategories,
  rewardStatuses,
} from "@/lib/rewards-shared";
export type RewardForm = z.infer<typeof RewardSchema>;
export const emptyReward: RewardForm = {
  name: "",
  description: "",
  image_url: null,
  category: "partner",
  partner_id: null,
  points_cost: 1,
  stock: null,
  conditions: "",
  delivery_method: "",
  delivery_days: 1,
  active: false,
  expires_at: null,
  uses_codes: false,
};
export function AdminEditor({
  reward,
  partner,
  partners,
  close,
}: {
  reward?: RewardForm | undefined;
  partner?: z.infer<typeof PartnerSchema> | undefined;
  partners: { id: string; name: string }[];
  close: () => void;
}) {
  const [r, setR] = useState(reward ?? emptyReward);
  const [p, setP] = useState(partner ?? { name: "", instructions: "", active: false });
  const [error, setError] = useState("");
  const sr = useServerFn(saveReward);
  const sp = useServerFn(savePartner);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (partner) return sp({ data: PartnerSchema.parse(p) });
      return sr({ data: RewardSchema.parse(r) });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reward-admin"] });
      await qc.invalidateQueries({ queryKey: ["rewards"] });
      close();
    },
  });
  const text = (
    key: "name" | "description" | "conditions" | "delivery_method" | "image_url",
    label: string,
    area = false,
  ) => (
    <label className="block space-y-1 text-sm">
      {label}
      {area ? (
        <Textarea value={r[key] ?? ""} onChange={(e) => setR({ ...r, [key]: e.target.value })} />
      ) : (
        <Input
          value={r[key] ?? ""}
          onChange={(e) => setR({ ...r, [key]: key === "image_url" ? e.target.value || null : e.target.value })}
        />
      )}
    </label>
  );
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !mutation.isPending) close();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{partner ? "Parceiro" : "Recompensa"}</DialogTitle>
          <DialogDescription>Cadastro administrativo</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            const parsed = partner ? PartnerSchema.safeParse(p) : RewardSchema.safeParse(r);
            if (!parsed.success) {
              setError("Confira os campos, as condições e o prazo de entrega.");
              return;
            }
            mutation.mutate();
          }}
        >
          {partner ? (
            <>
              <label className="block space-y-1 text-sm">
                Nome
                <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
              </label>
              <label className="block space-y-1 text-sm">
                Instruções
                <Textarea
                  value={p.instructions}
                  onChange={(e) => setP({ ...p, instructions: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={p.active}
                  onCheckedChange={(v) => setP({ ...p, active: v === true })}
                />
                Parceiro ativo
              </label>
            </>
          ) : (
            <>
              {text("name", "Nome")}
              {text("description", "Descrição", true)}
              <label className="block space-y-1 text-sm">
                Categoria
                <Select
                  value={r.category}
                  onValueChange={(v) => setR({ ...r, category: v as RewardForm["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(rewardCategories).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {r.category === "partner" && (
                <label className="block space-y-1 text-sm">
                  Parceiro
                  <Select
                    value={r.partner_id ?? ""}
                    onValueChange={(v) => setR({ ...r, partner_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar parceiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  Custo em pontos
                  <Input
                    type="number"
                    min={1}
                    value={r.points_cost}
                    onChange={(e) => setR({ ...r, points_cost: Number(e.target.value) })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  Estoque total
                  <Input
                    type="number"
                    min={0}
                    placeholder="Sem limite"
                    value={r.stock ?? ""}
                    onChange={(e) =>
                      setR({ ...r, stock: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              {text("conditions", "Condições de resgate", true)}
              {text("delivery_method", "Método de entrega")}
              <label className="block space-y-1 text-sm">
                Prazo em dias após aprovação
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={r.delivery_days}
                  onChange={(e) => setR({ ...r, delivery_days: Number(e.target.value) })}
                />
              </label>
              <label className="block space-y-1 text-sm">
                Validade (opcional)
                <Input
                  type="datetime-local"
                  value={r.expires_at ? localDate(r.expires_at) : ""}
                  onChange={(e) =>
                    setR({
                      ...r,
                      expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </label>
              {text("image_url", "Imagem HTTPS (opcional)")}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={r.uses_codes}
                  onCheckedChange={(v) => setR({ ...r, uses_codes: v === true })}
                />
                Entrega por código único
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={r.active}
                  onCheckedChange={(v) => setR({ ...r, active: v === true })}
                />
                Recompensa ativa
              </label>
            </>
          )}
          {(error || mutation.isError) && (
            <p role="alert" className="text-sm text-negative">
              {error || mutation.error?.message}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function localDate(value: string) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function CodesEditor({ id, close }: { id: string; close: () => void }) {
  const [codes, setCodes] = useState("");
  const [expires, setExpires] = useState("");
  const fn = useServerFn(addRewardCodes);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      fn({
        data: {
          rewardId: id,
          codes: codes
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean),
          ...(expires ? { expiresAt: new Date(expires).toISOString() } : {}),
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reward-admin"] });
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !mutation.isPending) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Códigos privados</DialogTitle>
          <DialogDescription>Lote de até 100 códigos únicos</DialogDescription>
        </DialogHeader>
        <label className="space-y-1 text-sm">
          Um código por linha
          <Textarea
            value={codes}
            onChange={(e) => {
              setCodes(e.target.value);
              mutation.reset();
            }}
          />
        </label>
        <label className="space-y-1 text-sm">
          Validade
          <Input
            type="datetime-local"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </label>
        <Button disabled={mutation.isPending || !codes.trim()} onClick={() => mutation.mutate()}>
          Adicionar códigos
        </Button>
        {mutation.isError && (
          <p role="alert" className="text-negative">
            {mutation.error.message}
          </p>
        )}
        {mutation.isSuccess && <p>{mutation.data} códigos adicionados.</p>}
      </DialogContent>
    </Dialog>
  );
}
export function ProcessEditor({
  request,
  uid,
  close,
}: {
  request: { id: string; status: string; snapshot: unknown };
  uid: string;
  close: () => void;
}) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState("");
  const [instructions, setInstructions] = useState("");
  const fn = useServerFn(processReward);
  const details = useServerFn(getAdminDelivery);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["reward-admin", "delivery", uid, request.id],
    queryFn: () => details({ data: { id: request.id } }),
  });
  const category = (request.snapshot as Record<string, unknown>)["category"];
  const options =
    request.status === "pending"
      ? ["approved", "rejected", "canceled"]
      : request.status === "approved"
        ? category === "physical"
          ? ["shipped", "delivered"]
          : ["delivered"]
        : request.status === "shipped"
          ? ["delivered"]
          : [];
  const mutation = useMutation({
    mutationFn: () =>
      fn({ data: ProcessSchema.parse({ id: request.id, status, note, tracking, instructions }) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reward-admin"] });
      await qc.invalidateQueries({ queryKey: ["rewards"] });
      close();
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !mutation.isPending) close();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Processar solicitação</DialogTitle>
          <DialogDescription>{rewardStatuses[request.status]}</DialogDescription>
        </DialogHeader>
        {query.isPending ? (
          <p>Carregando entrega...</p>
        ) : query.isError ? (
          <p role="alert">{query.error.message}</p>
        ) : (
          <>
            {query.data.delivery?.address && (
              <dl className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(query.data.delivery.address as Record<string, unknown>).map(
                  ([k, v]) => (
                    <div key={k}>
                      <dt className="text-muted-foreground">
                        {{
                          recipient: "Destinatário",
                          postal_code: "CEP",
                          street: "Rua",
                          number: "Número",
                          district: "Bairro",
                          city: "Cidade",
                          state: "UF",
                          complement: "Complemento",
                        }[k] ?? k}
                      </dt>
                      <dd className="break-words">{String(v)}</dd>
                    </div>
                  ),
                )}
              </dl>
            )}
            {query.data.codes.map((c) => (
              <p key={c.code} className="break-all text-sm">
                Código reservado: {c.code}
              </p>
            ))}
            {query.data.delivery?.tracking && (
              <p className="text-sm">Rastreio: {query.data.delivery.tracking}</p>
            )}
          </>
        )}
        {options.length > 0 && (
          <>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar ação" />
              </SelectTrigger>
              <SelectContent>
                {options.map((s) => (
                  <SelectItem key={s} value={s}>
                    {rewardStatuses[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="space-y-1 text-sm">
              Motivo / observação ao titular
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            {["shipped", "delivered"].includes(status) && (
              <>
                <label className="space-y-1 text-sm">
                  Rastreio
                  <Input value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </label>
                <label className="space-y-1 text-sm">
                  Comprovação / instruções de entrega
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </label>
              </>
            )}
            <Button disabled={!status || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Registrando..." : "Confirmar ação"}
            </Button>
          </>
        )}
        {mutation.isError && (
          <p role="alert" className="text-negative">
            {mutation.error.message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
