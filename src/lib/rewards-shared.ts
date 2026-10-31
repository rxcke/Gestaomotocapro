import { z } from "zod";
export const rewardCategories = {
  partner: "Parceiros",
  physical: "Produtos físicos",
  digital: "Benefícios digitais",
} as const;
export const rewardStatuses: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  canceled: "Cancelado",
  shipped: "Enviado",
  delivered: "Entregue",
};
export const rewardPage = (v: unknown) =>
  Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Math.min(Number(v), 100000) : 1;
export const rewardMeta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Gestão Motoca Pro` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Gestão Motoca Pro` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ],
});
export const AddressSchema = z
  .object({
    recipient: z.string().trim().min(2).max(150),
    postal_code: z.string().regex(/^\d{8}$/),
    street: z.string().trim().min(2).max(150),
    number: z.string().trim().min(1).max(30),
    district: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    state: z.string().regex(/^[A-Z]{2}$/),
    complement: z.string().max(150).optional(),
  })
  .strict();
export const RewardSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(150),
  description: z.string().max(3000),
  image_url: z.string().url().startsWith("https://").nullable(),
  category: z.enum(["partner", "physical", "digital"]),
  partner_id: z.string().uuid().nullable(),
  points_cost: z.number().int().positive(),
  stock: z.number().int().nonnegative().nullable(),
  conditions: z.string().trim().min(3).max(3000),
  delivery_method: z.string().trim().min(3).max(200),
  delivery_days: z.number().int().min(0).max(365),
  active: z.boolean(),
  expires_at: z.string().datetime().nullable(),
  uses_codes: z.boolean(),
});
export const PartnerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(150),
  instructions: z.string().max(3000),
  active: z.boolean(),
});
export const ProcessSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "canceled", "shipped", "delivered"]),
  note: z.string().max(1000).default(""),
  tracking: z.string().max(200).default(""),
  instructions: z.string().max(2000).default(""),
});
export function rewardError(message: string) {
  const errors: Record<string, string> = {
    club_closed: "Os resgates ainda não estão liberados.",
    not_eligible: "Seu acesso atual não permite este resgate.",
    reward_unavailable: "Esta recompensa não está disponível.",
    stock_insufficient: "Não há disponibilidade para este resgate.",
    points_insufficient: "Seu saldo disponível é insuficiente.",
    price_changed: "O custo mudou. Confira os detalhes e confirme novamente.",
    idempotency_conflict: "Esta solicitação já foi enviada com outros dados.",
    reward_forbidden: "Você não tem permissão para esta operação.",
    invalid_transition: "Esta mudança de situação não é permitida.",
    address_required: "Confira os dados necessários para envio.",
    address_not_required: "Esta recompensa não precisa de endereço.",
    reason_required: "Informe o motivo da rejeição.",
    code_expired: "O código reservado venceu. A solicitação não foi aprovada.",
    delivery_required: "Registre as informações de entrega.",
    reward_structure_locked:
      "Há unidades comprometidas. A categoria, o parceiro e o uso de códigos não podem mudar.",
  };
  return (
    Object.entries(errors).find(([key]) => message.includes(key))?.[1] ??
    "Não foi possível concluir. Confira os dados e tente novamente."
  );
}
