// Pure calculation module. No DOM, no I/O.
export const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

export const factor = (r, n) => (r === 0 ? 1 / n : (r / 12) / (1 - Math.pow(1 + r / 12, -n)));

// Payments: one per 30 days (360 days = 12), minimum 1.
export const trustlinePayments = (days) => Math.max(1, Math.round(days / 30));

export function tierIndex(T, tiers) {
  const i = tiers.findIndex((limit) => T < limit);
  return i === -1 ? tiers.length : i;
}

export function calculate({ sale, dp, cc, termDays, years }, config) {
  const downPayment = sale * dp;
  const ccAmount = sale * cc;
  const trustlinePct = dp - cc;
  const advance = sale * trustlinePct;

  const row = config.trustline.terms[String(termDays)];
  if (!row) throw new Error(`Unknown Trustline term: ${termDays}`);
  const closingFeePct = row.closingFee;
  const processingFee = row.fees[tierIndex(advance, config.trustline.tiers)];
  const closingFee = advance * closingFeePct;
  const costOfAdvance = advance + closingFee + processingFee;
  const payments = trustlinePayments(termDays);
  const trustlineMonthly = costOfAdvance / payments;

  const balance = sale - downPayment;
  const rate = config.vidantaRates[String(years)];
  if (rate === undefined) throw new Error(`Unknown Vidanta term: ${years}`);
  const months = years * 12;
  const vidantaMonthly = balance * factor(rate, months);

  return {
    downPayment, ccAmount, dueToday: ccAmount, trustlinePct, advance,
    closingFeePct, closingFee, processingFee, costOfAdvance, payments, trustlineMonthly,
    balance, rate, months, vidantaMonthly,
    phase1: { from: 1, to: Math.min(payments, months), amount: trustlineMonthly + vidantaMonthly },
    phase2: payments < months ? { from: payments + 1, to: months, amount: vidantaMonthly } : null,
  };
}
