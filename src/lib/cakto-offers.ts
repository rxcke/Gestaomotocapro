export type CaktoPlan = "monthly" | "quarterly" | "annual";

type CaktoOfferConfiguration = {
  start: string;
  pro: string;
  elite: string;
};

/**
 * Cakto checkout slugs may append an internal checkout suffix after the
 * webhook offer identifier (for example: 9bnu895_1126693 -> 9bnu895).
 * This normalization is identifier-only and never uses offer names/prices.
 */
export function webhookOfferId(configuredOfferId: string): string {
  const separatorIndex = configuredOfferId.indexOf("_");
  return separatorIndex > 0 ? configuredOfferId.slice(0, separatorIndex) : configuredOfferId;
}

export function resolveCaktoPlan(
  receivedOfferId: string | null,
  configuration: CaktoOfferConfiguration,
): CaktoPlan | null {
  if (!receivedOfferId) return null;

  const offers: Array<[string, CaktoPlan]> = [
    [webhookOfferId(configuration.start), "monthly"],
    [webhookOfferId(configuration.pro), "quarterly"],
    [webhookOfferId(configuration.elite), "annual"],
  ];

  const match = offers.find(([offerId]) => offerId === receivedOfferId);
  return match?.[1] ?? null;
}

export function hasDistinctWebhookOfferIds(configuration: CaktoOfferConfiguration): boolean {
  return new Set([
    webhookOfferId(configuration.start),
    webhookOfferId(configuration.pro),
    webhookOfferId(configuration.elite),
  ]).size === 3;
}