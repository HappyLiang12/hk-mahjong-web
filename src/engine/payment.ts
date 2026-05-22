/**
 * HK Mahjong Payment Calculator
 * STORY-125
 *
 * Standard HK rules:
 * - Base points = 2^fan
 * - Self-draw: all 3 opponents pay base (dealer pays/receives 1.5x)
 * - Discard win: discarder pays full, others pay half (house rule variant: discarder pays all)
 * - Dealer involvement: 1.5x multiplier when dealer wins or pays
 * - Bonus sticks: flat addition per payment
 * - Max fan cap from house rules
 */

import { HouseRules } from './house-rules';

export interface PaymentResult {
  winner: number;
  payments: { from: number; to: number; amount: number; reason: string }[];
  totalWon: number;
  breakdown: {
    baseFan: number;
    basePoints: number;
    selfDrawMultiplier: number;
    dealerMultiplier: number;
    bonusSticks: number;
    comboMultiplier: number;
    seasonalMultiplier: number;
  };
}

const PLAYER_COUNT = 4;
const DEALER_MULTIPLIER = 1.5;

/**
 * Cap fan according to house rules maxFan.
 */
function capFan(fan: number, maxFan: HouseRules['maxFan']): number {
  if (maxFan === 'unlimited') return fan;
  return Math.min(fan, maxFan);
}

/**
 * Calculate base points: 2^fan (HK standard).
 */
function basePoints(fan: number): number {
  return Math.pow(2, fan);
}

/**
 * Calculate payment for a single payer → winner line.
 */
function singlePayment(
  base: number,
  payerIsDealer: boolean,
  winnerIsDealer: boolean,
  bonusPerPayment: number,
  combo: number,
  seasonal: number,
): number {
  let amount = base;

  // Dealer multiplier: applies when either party is dealer
  if (payerIsDealer || winnerIsDealer) {
    amount = Math.ceil(amount * DEALER_MULTIPLIER);
  }

  // Combo & seasonal multipliers
  amount = Math.ceil(amount * combo * seasonal);

  // Bonus sticks: flat add
  amount += bonusPerPayment;

  return amount;
}

export function calculatePayment(
  winner: number,
  fan: number,
  method: 'self_draw' | 'discard',
  discarder: number | null,
  dealerSeat: number,
  bonusSticks: number,
  houseRules: HouseRules,
  comboMultiplier: number = 1,
  seasonalMultiplier: number = 1,
): PaymentResult {
  const cappedFan = capFan(fan, houseRules.maxFan);
  const base = basePoints(cappedFan);
  const winnerIsDealer = winner === dealerSeat;
  const bonusPerPayment = bonusSticks; // +1 per stick per payment line

  const payments: PaymentResult['payments'] = [];

  if (method === 'self_draw') {
    // All 3 opponents pay
    for (let seat = 0; seat < PLAYER_COUNT; seat++) {
      if (seat === winner) continue;
      const payerIsDealer = seat === dealerSeat;
      const amount = singlePayment(base, payerIsDealer, winnerIsDealer, bonusPerPayment, comboMultiplier, seasonalMultiplier);
      const reason = payerIsDealer || winnerIsDealer ? 'self_draw_dealer' : 'self_draw';
      payments.push({ from: seat, to: winner, amount, reason });
    }
  } else {
    // Discard win
    if (discarder === null) {
      throw new Error('Discard win requires a discarder seat');
    }

    // Some house rules: discarder pays all (falseWinPenalty > 0 used as a proxy isn't right;
    // we use a simple heuristic: if allowSelfDrawOnly is false, standard split applies)
    // Standard HK: discarder pays full, others pay half
    for (let seat = 0; seat < PLAYER_COUNT; seat++) {
      if (seat === winner) continue;
      const payerIsDealer = seat === dealerSeat;
      const isDiscarder = seat === discarder;
      let payBase = isDiscarder ? base : Math.ceil(base / 2);
      const amount = singlePayment(payBase, payerIsDealer, winnerIsDealer, bonusPerPayment, comboMultiplier, seasonalMultiplier);
      const reason = isDiscarder
        ? (payerIsDealer || winnerIsDealer ? 'discard_full_dealer' : 'discard_full')
        : (payerIsDealer || winnerIsDealer ? 'discard_half_dealer' : 'discard_half');
      payments.push({ from: seat, to: winner, amount, reason });
    }
  }

  const totalWon = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    winner,
    payments,
    totalWon,
    breakdown: {
      baseFan: cappedFan,
      basePoints: base,
      selfDrawMultiplier: method === 'self_draw' ? 1 : 0,
      dealerMultiplier: winnerIsDealer ? DEALER_MULTIPLIER : 1,
      bonusSticks,
      comboMultiplier,
      seasonalMultiplier,
    },
  };
}

const REASON_LABELS: Record<string, Record<string, string>> = {
  self_draw: {
    en: 'Self-draw',
    'zh-TW': '自摸',
    'zh-CN': '自摸',
    ja: 'ツモ',
  },
  self_draw_dealer: {
    en: 'Self-draw (dealer)',
    'zh-TW': '自摸（莊家）',
    'zh-CN': '自摸（庄家）',
    ja: 'ツモ（親）',
  },
  discard_full: {
    en: 'Discard (full)',
    'zh-TW': '放銃（全額）',
    'zh-CN': '放铳（全额）',
    ja: '放銃（全額）',
  },
  discard_full_dealer: {
    en: 'Discard (full, dealer)',
    'zh-TW': '放銃（全額，莊家）',
    'zh-CN': '放铳（全额，庄家）',
    ja: '放銃（全額、親）',
  },
  discard_half: {
    en: 'Discard (half)',
    'zh-TW': '旁觀（半額）',
    'zh-CN': '旁观（半额）',
    ja: '半額',
  },
  discard_half_dealer: {
    en: 'Discard (half, dealer)',
    'zh-TW': '旁觀（半額，莊家）',
    'zh-CN': '旁观（半额，庄家）',
    ja: '半額（親）',
  },
};

export function formatPaymentBreakdown(result: PaymentResult, lang: string): string[] {
  const lines: string[] = [];
  const l = lang || 'en';

  // Header
  const headerMap: Record<string, string> = {
    en: `Winner: Player ${result.winner + 1} — ${result.breakdown.baseFan} fan, ${result.breakdown.basePoints} base pts`,
    'zh-TW': `胡牌：玩家${result.winner + 1} — ${result.breakdown.baseFan}番，底${result.breakdown.basePoints}分`,
    'zh-CN': `胡牌：玩家${result.winner + 1} — ${result.breakdown.baseFan}番，底${result.breakdown.basePoints}分`,
    ja: `和了：プレイヤー${result.winner + 1} — ${result.breakdown.baseFan}翻、${result.breakdown.basePoints}基本点`,
  };
  lines.push(headerMap[l] || headerMap.en);

  // Each payment
  for (const p of result.payments) {
    const reasonLabel = REASON_LABELS[p.reason]?.[l] || REASON_LABELS[p.reason]?.en || p.reason;
    const payMap: Record<string, string> = {
      en: `Player ${p.from + 1} → Player ${p.to + 1}: ${p.amount} pts (${reasonLabel})`,
      'zh-TW': `玩家${p.from + 1} → 玩家${p.to + 1}：${p.amount}分（${reasonLabel}）`,
      'zh-CN': `玩家${p.from + 1} → 玩家${p.to + 1}：${p.amount}分（${reasonLabel}）`,
      ja: `P${p.from + 1} → P${p.to + 1}：${p.amount}点（${reasonLabel}）`,
    };
    lines.push(payMap[l] || payMap.en);
  }

  // Total
  const totalMap: Record<string, string> = {
    en: `Total won: ${result.totalWon} pts`,
    'zh-TW': `總計：${result.totalWon}分`,
    'zh-CN': `总计：${result.totalWon}分`,
    ja: `合計：${result.totalWon}点`,
  };
  lines.push(totalMap[l] || totalMap.en);

  // Multiplier notes
  if (result.breakdown.comboMultiplier !== 1) {
    lines.push(l.startsWith('zh') ? `連莊倍率：×${result.breakdown.comboMultiplier}` : `Combo: ×${result.breakdown.comboMultiplier}`);
  }
  if (result.breakdown.seasonalMultiplier !== 1) {
    lines.push(l.startsWith('zh') ? `季節倍率：×${result.breakdown.seasonalMultiplier}` : `Seasonal: ×${result.breakdown.seasonalMultiplier}`);
  }
  if (result.breakdown.bonusSticks > 0) {
    lines.push(l.startsWith('zh') ? `獎勵棒：+${result.breakdown.bonusSticks}/筆` : `Bonus sticks: +${result.breakdown.bonusSticks}/payment`);
  }

  return lines;
}
