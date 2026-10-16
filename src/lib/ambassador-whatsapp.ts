export const AMBASSADOR_WHATSAPP_NUMBER = "5531983662706";

export const DEFAULT_AMBASSADOR_MESSAGE =
  "Olá! Tenho interesse em me tornar embaixador do Gestão Motoca Pro. Gostaria de conhecer o programa e como começar.";

export type AmbassadorProfile = "criador" | "entregador" | "comunidade";

export const PROFILE_MESSAGES: Record<AmbassadorProfile, string> = {
  criador:
    "Olá! Sou criador de conteúdo e tenho interesse em conhecer o Programa de Embaixadores do Gestão Motoca Pro. Gostaria de saber como começar.",
  entregador:
    "Olá! Sou motoboy/entregador e tenho interesse em conhecer o Programa de Embaixadores do Gestão Motoca Pro como profissional de entregas. Gostaria de saber como começar.",
  comunidade:
    "Olá! Sou influenciador/administrador de comunidade e tenho interesse em conhecer o Programa de Embaixadores do Gestão Motoca Pro para divulgar à minha audiência. Gostaria de saber como começar.",
};

export function ambassadorWhatsAppUrl(profile: AmbassadorProfile | null): string {
  const text = profile ? PROFILE_MESSAGES[profile] : DEFAULT_AMBASSADOR_MESSAGE;
  return `https://wa.me/${AMBASSADOR_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
