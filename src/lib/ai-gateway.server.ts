import { createOpenAI } from "@ai-sdk/openai";

export function createInsightsModel(apiKey: string) {
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  return provider.responses("openai/gpt-6-astra");
}