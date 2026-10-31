import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestReward, type getRewards } from "@/lib/rewards.functions";
import { AddressSchema, rewardCategories } from "@/lib/rewards-shared";
type Reward = Awaited<ReturnType<typeof getRewards>>["rewards"][number];
const addressFields = {
  recipient: "Destinatário",
  postal_code: "CEP (8 números)",
  street: "Rua",
  number: "Número",
  district: "Bairro",
  city: "Cidade",
  state: "UF",
  complement: "Complemento",
};
export function RewardDetails({
  reward,
  enabled,
  available,
  onClose,
}: {
  reward: Reward;
  enabled: boolean;
  available: number;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const [address, setAddress] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const send = useServerFn(requestReward);
  const mutation = useMutation({
    mutationFn: () =>
      send({
        data: {
          rewardId: reward.id,
          key,
          expectedCost: reward.points_cost,
          ...(reward.category === "physical" ? { address: AddressSchema.parse(address) } : {}),
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rewards"] });
      await navigate({ to: "/app/resgates", search: { page: 1 } });
      onClose();
    },
  });
  const unavailable =
    (reward.stock !== null && reward.stock <= reward.committed) ||
    (reward.expires_at !== null && new Date(reward.expires_at) <= new Date());
  const submit = () => {
    setValidation("");
    if (reward.category === "physical" && !AddressSchema.safeParse(address).success) {
      setValidation("Confira os dados necessários para envio.");
      return;
    }
    mutation.mutate();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{confirm ? "Confirmar resgate" : reward.name}</DialogTitle>
          <DialogDescription>
            {rewardCategories[reward.category as keyof typeof rewardCategories]} ·{" "}
            {reward.points_cost} pontos
          </DialogDescription>
        </DialogHeader>
        {reward.image_url ? (
          <img
            src={reward.image_url}
            alt={reward.name}
            className="aspect-video w-full rounded-md object-cover"
          />
        ) : (
          <Gift className="size-10 text-accent" />
        )}
        <p className="whitespace-pre-wrap text-sm">{reward.description}</p>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold">Condições</dt>
            <dd className="whitespace-pre-wrap text-muted-foreground">{reward.conditions}</dd>
          </div>
          <div>
            <dt className="font-semibold">Entrega</dt>
            <dd className="text-muted-foreground">
              {reward.delivery_method} · até {reward.delivery_days} dias após aprovação
            </dd>
          </div>
          {reward.expires_at && (
            <div>
              <dt className="font-semibold">Validade</dt>
              <dd>{new Date(reward.expires_at).toLocaleString("pt-BR")}</dd>
            </div>
          )}
          {reward.stock !== null && (
            <div>
              <dt className="font-semibold">Disponíveis</dt>
              <dd>{Math.max(0, reward.stock - reward.committed)}</dd>
            </div>
          )}
        </dl>
        {confirm && (
          <>
            <p className="border-t border-border pt-4 text-sm">
              Serão reservados <strong>{reward.points_cost} pontos</strong>. Disponível após
              solicitar: <strong>{available - reward.points_cost} pontos</strong>.
            </p>
            {reward.category === "physical" && (
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-3 font-semibold">Dados de envio</legend>
                {Object.entries(addressFields).map(([name, label]) => (
                  <label key={name} className="space-y-1 text-xs">
                    {label}
                    <Input
                      value={address[name] ?? ""}
                      maxLength={150}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          [name]: name === "state" ? e.target.value.toUpperCase() : e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
              </fieldset>
            )}
          </>
        )}
        {!enabled && <p className="text-sm text-muted-foreground">Resgates ainda não liberados.</p>}
        {available < reward.points_cost && (
          <p className="text-sm text-muted-foreground">Saldo disponível insuficiente.</p>
        )}
        {(validation || mutation.isError) && (
          <p role="alert" className="text-sm text-negative">
            {validation || mutation.error?.message}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={mutation.isPending} onClick={onClose}>
            Voltar
          </Button>
          <Button
            disabled={
              !enabled || unavailable || available < reward.points_cost || mutation.isPending
            }
            onClick={() => (confirm ? submit() : setConfirm(true))}
          >
            <Gift className="size-4" />
            {mutation.isPending ? "Solicitando..." : confirm ? "Confirmar solicitação" : "Resgatar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
