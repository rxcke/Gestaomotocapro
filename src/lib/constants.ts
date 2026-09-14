export const APP_NAME = "MotoFinance";
export const APP_TAGLINE = "Seu dinheiro. Sua moto. Seu resultado.";

export const INCOME_CATEGORIES = [
  "Entrega",
  "Corrida",
  "Frete",
  "Salário",
  "Serviço",
  "Venda",
  "Outro",
] as const;

export const EXPENSE_GROUPS: Record<string, string[]> = {
  Moto: [
    "Combustível",
    "Manutenção",
    "Peças",
    "Pneus",
    "Óleo",
    "Oficina",
    "Lavagem",
    "Documentação",
    "IPVA",
    "Licenciamento",
    "Seguro",
    "Multa",
  ],
  Trabalho: ["Alimentação", "Estacionamento", "Pedágio", "Outros"],
  Pessoal: ["Outros"],
};

// Categorias que representam custo de rodar com a moto (usadas no custo/km)
export const MOTO_EXPENSE_GROUP = "Moto";

export const MAINTENANCE_CATEGORIES = [
  "Óleo",
  "Filtro",
  "Pneus",
  "Relação",
  "Pastilhas",
  "Freios",
  "Suspensão",
  "Bateria",
  "Velas",
  "Revisão",
  "Motor",
  "Elétrica",
  "Outro",
] as const;

export const DOCUMENT_TYPES = ["IPVA", "Licenciamento", "Seguro", "CNH", "Outros"] as const;

export const USAGE_TYPES = ["Trabalho", "Dia a dia", "Viagens", "Lazer", "Todos"] as const;

export const GOAL_TYPES = [
  { value: "mensal", label: "Meta mensal" },
  { value: "semanal", label: "Meta semanal" },
  { value: "economia", label: "Meta de economia" },
] as const;

export const KM_ALERT_THRESHOLD = 500;
export const DAYS_ALERT_THRESHOLD = 15;
