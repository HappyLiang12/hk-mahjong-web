import { calculatePayment, formatPaymentBreakdown, PaymentResult } from '../engine/payment';
import { DEFAULT_HOUSE_RULES, HouseRules } from '../engine/house-rules';

const rules = DEFAULT_HOUSE_RULES;

describe('calculatePayment', () => {
  // 1. Basic self-draw, no dealer involvement
  it('self-draw 3 fan, non-dealer winner, no bonus', () => {
    const r = calculatePayment(1, 3, 'self_draw', null, 0, 0, rules);
    // base = 2^3 = 8. Seat 0 is dealer → pays ceil(8*1.5)=12. Seats 2,3 pay 8 each.
    expect(r.breakdown.basePoints).toBe(8);
    expect(r.payments).toHaveLength(3);
    const dealerPay = r.payments.find(p => p.from === 0)!;
    expect(dealerPay.amount).toBe(12); // dealer pays 1.5x
    const nonDealerPay = r.payments.find(p => p.from === 2)!;
    expect(nonDealerPay.amount).toBe(8);
    expect(r.totalWon).toBe(12 + 8 + 8);
  });

  // 2. Self-draw, winner IS dealer
  it('self-draw 3 fan, dealer wins', () => {
    const r = calculatePayment(0, 3, 'self_draw', null, 0, 0, rules);
    // All 3 opponents pay ceil(8*1.5)=12
    expect(r.payments.every(p => p.amount === 12)).toBe(true);
    expect(r.totalWon).toBe(36);
  });

  // 3. Discard win, standard split
  it('discard win 5 fan, non-dealer', () => {
    const r = calculatePayment(2, 5, 'discard', 1, 0, 0, rules);
    // base = 32. discarder(1) pays 32, others pay ceil(32/2)=16
    // seat 0 is dealer → pays ceil(16*1.5)=24
    const discarderPay = r.payments.find(p => p.from === 1)!;
    expect(discarderPay.amount).toBe(32);
    const dealerPay = r.payments.find(p => p.from === 0)!;
    expect(dealerPay.amount).toBe(24); // half=16, dealer 1.5x=24
    const otherPay = r.payments.find(p => p.from === 3)!;
    expect(otherPay.amount).toBe(16);
  });

  // 4. Discard win, discarder is dealer
  it('discard win, discarder is dealer', () => {
    const r = calculatePayment(1, 3, 'discard', 0, 0, 0, rules);
    // base=8. Discarder=seat0(dealer) pays ceil(8*1.5)=12
    const discarderPay = r.payments.find(p => p.from === 0)!;
    expect(discarderPay.amount).toBe(12);
  });

  // 5. Discard win, winner is dealer
  it('discard win, winner is dealer', () => {
    const r = calculatePayment(0, 3, 'discard', 2, 0, 0, rules);
    // base=8, winner is dealer so all pay 1.5x
    // discarder(2) pays ceil(8*1.5)=12, others pay ceil(4*1.5)=6
    const discarderPay = r.payments.find(p => p.from === 2)!;
    expect(discarderPay.amount).toBe(12);
    const otherPay = r.payments.find(p => p.from === 1)!;
    expect(otherPay.amount).toBe(6);
  });

  // 6. Bonus sticks
  it('adds bonus sticks per payment', () => {
    const r = calculatePayment(1, 3, 'self_draw', null, 0, 5, rules);
    // Each payment gets +5
    const dealerPay = r.payments.find(p => p.from === 0)!;
    expect(dealerPay.amount).toBe(12 + 5); // 17
    const otherPay = r.payments.find(p => p.from === 2)!;
    expect(otherPay.amount).toBe(8 + 5); // 13
  });

  // 7. Max fan cap
  it('caps fan at maxFan', () => {
    const capped: HouseRules = { ...rules, maxFan: 8 };
    const r = calculatePayment(1, 15, 'self_draw', null, 0, 0, capped);
    expect(r.breakdown.baseFan).toBe(8);
    expect(r.breakdown.basePoints).toBe(256); // 2^8
  });

  // 8. Unlimited max fan
  it('unlimited maxFan allows high fan', () => {
    const unlimited: HouseRules = { ...rules, maxFan: 'unlimited' };
    const r = calculatePayment(1, 13, 'self_draw', null, 0, 0, unlimited);
    expect(r.breakdown.baseFan).toBe(13);
    expect(r.breakdown.basePoints).toBe(8192);
  });

  // 9. Combo multiplier
  it('applies combo multiplier', () => {
    const r = calculatePayment(2, 3, 'self_draw', null, 0, 0, rules, 2);
    // base=8, non-dealer-non-dealer: ceil(8*1*2)=16; dealer: ceil(12*..wait
    // singlePayment: base=8, combo=2 → ceil(8*2*1)=16 for non-dealer
    // dealer(seat0): ceil(8*1.5)=12 then ceil(12*2*1)=24
    const dealerPay = r.payments.find(p => p.from === 0)!;
    expect(dealerPay.amount).toBe(24);
    const otherPay = r.payments.find(p => p.from === 1)!;
    expect(otherPay.amount).toBe(16);
  });

  // 10. Seasonal multiplier
  it('applies seasonal multiplier', () => {
    const r = calculatePayment(1, 3, 'self_draw', null, 0, 0, rules, 1, 1.5);
    // base=8, dealer(seat0): ceil(12*1*1.5)=18, others: ceil(8*1*1.5)=12
    const dealerPay = r.payments.find(p => p.from === 0)!;
    expect(dealerPay.amount).toBe(18);
    const otherPay = r.payments.find(p => p.from === 2)!;
    expect(otherPay.amount).toBe(12);
  });

  // 11. Discard win requires discarder
  it('throws if discard method but no discarder', () => {
    expect(() => calculatePayment(1, 3, 'discard', null, 0, 0, rules)).toThrow();
  });

  // 12. 0 fan edge case
  it('handles 0 fan (base=1)', () => {
    const r = calculatePayment(1, 0, 'self_draw', null, 0, 0, rules);
    expect(r.breakdown.basePoints).toBe(1);
  });
});

describe('formatPaymentBreakdown', () => {
  it('formats in English', () => {
    const r = calculatePayment(0, 3, 'self_draw', null, 0, 0, rules);
    const lines = formatPaymentBreakdown(r, 'en');
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines[0]).toContain('3 fan');
    expect(lines[lines.length - 1]).toContain('Total');
  });

  it('formats in zh-TW', () => {
    const r = calculatePayment(0, 3, 'self_draw', null, 0, 2, rules);
    const lines = formatPaymentBreakdown(r, 'zh-TW');
    expect(lines[0]).toContain('3番');
    expect(lines.some(l => l.includes('獎勵棒'))).toBe(true);
  });
});
