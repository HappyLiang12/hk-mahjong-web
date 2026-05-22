/**
 * Wind Round & Dealer Rotation System — STORY-124
 * Proper HK mahjong wind round tracking with 場風, 連莊, 積棒.
 */

export type Wind = 'east' | 'south' | 'west' | 'north';

export interface RoundState {
  prevailingWind: Wind;
  dealerSeat: number;        // 0-3
  dealerConsecutive: number;  // 連莊
  roundNumber: number;        // overall round counter (starts 1)
  handNumber: number;         // hand within current wind round (1-4)
  bonusSticks: number;        // 積棒
}

export const WIND_ORDER: Wind[] = ['east', 'south', 'west', 'north'];

const WIND_DISPLAY: Record<Wind, { char: string; emoji: string; en: string; 'zh-TW': string; 'zh-CN': string; ja: string }> = {
  east:  { char: '東', emoji: '🀀', en: 'East',  'zh-TW': '東', 'zh-CN': '东', ja: '東' },
  south: { char: '南', emoji: '🀁', en: 'South', 'zh-TW': '南', 'zh-CN': '南', ja: '南' },
  west:  { char: '西', emoji: '🀂', en: 'West',  'zh-TW': '西', 'zh-CN': '西', ja: '西' },
  north: { char: '北', emoji: '🀃', en: 'North', 'zh-TW': '北', 'zh-CN': '北', ja: '北' },
};

export function createRoundState(): RoundState {
  return {
    prevailingWind: 'east',
    dealerSeat: 0,
    dealerConsecutive: 0,
    roundNumber: 1,
    handNumber: 1,
    bonusSticks: 0,
  };
}

/**
 * Advance round state after a hand ends.
 *
 * - Dealer wins → same dealer, consecutive++, bonusSticks++
 * - Draw → dealer stays, bonusSticks++
 * - Dealer loses → rotate dealer, reset consecutive, bonusSticks resets
 *   - If handNumber was 4 → advance prevailing wind
 */
export function advanceRound(
  state: RoundState,
  dealerWon: boolean,
  isDraw: boolean,
): RoundState {
  const next = { ...state };
  next.roundNumber = state.roundNumber + 1;

  if (dealerWon) {
    // Dealer wins: stays, consecutive increases
    next.dealerConsecutive = state.dealerConsecutive + 1;
    next.bonusSticks = state.bonusSticks + 1;
    // handNumber does NOT advance (dealer repeats)
    return next;
  }

  if (isDraw) {
    // Draw: dealer stays, bonus sticks increase, hand doesn't advance
    next.bonusSticks = state.bonusSticks + 1;
    return next;
  }

  // Dealer lost: rotate
  next.dealerConsecutive = 0;
  next.bonusSticks = 0;

  if (state.handNumber >= 4) {
    // Advance prevailing wind
    const windIdx = WIND_ORDER.indexOf(state.prevailingWind);
    if (windIdx + 1 < WIND_ORDER.length) {
      next.prevailingWind = WIND_ORDER[windIdx + 1];
    } else {
      // Past north — signal via handNumber overflow for game-over detection
      next.handNumber = 5;
      next.dealerSeat = (state.dealerSeat + 1) % 4;
      return next;
    }
    next.handNumber = 1;
  } else {
    next.handNumber = state.handNumber + 1;
  }

  next.dealerSeat = (state.dealerSeat + 1) % 4;
  return next;
}

/**
 * Check if game is over based on house rules roundWind setting.
 */
export function isGameOver(
  state: RoundState,
  houseRules: { roundWind: string },
): boolean {
  const windIdx = WIND_ORDER.indexOf(state.prevailingWind);

  // How many wind rounds are played?
  const maxWinds = houseRules.roundWind === 'east_only' ? 1
    : houseRules.roundWind === 'east_south' ? 2
    : 4; // 'full'

  // If prevailing wind index >= maxWinds, game is over
  if (windIdx >= maxWinds) return true;
  // Edge case: last wind, handNumber overflowed (past 4)
  if (windIdx === maxWinds - 1 && state.handNumber > 4) return true;

  return false;
}

/**
 * Get the wind for a given seat relative to the dealer.
 * Dealer is always East; seat to dealer's right is South, etc.
 */
export function getPlayerWind(seatIndex: number, dealerSeat: number): Wind {
  const offset = (seatIndex - dealerSeat + 4) % 4;
  return WIND_ORDER[offset];
}

/**
 * Get display info for a wind.
 */
export function getWindDisplay(wind: Wind): { char: string; emoji: string; en: string; 'zh-TW': string; 'zh-CN': string; ja: string } {
  return WIND_DISPLAY[wind];
}
