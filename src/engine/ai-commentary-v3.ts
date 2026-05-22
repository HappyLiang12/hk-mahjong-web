// STORY-334: AI Commentary V3 — Personality & Contextual Awareness

export interface CommentaryPersonality {
  id: string;
  name: { en: string; 'zh-TW': string };
  style: 'casual' | 'professional' | 'humorous' | 'dramatic' | 'educational';
  excitability: number;
  verbosity: number;
}

export interface CommentaryLine {
  id: string;
  trigger: string;
  personality: string;
  text: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
  minExcitement: number;
  cooldown: number;
}

export interface CommentaryState {
  personality: string;
  excitement: number;
  lastLines: string[];
  cooldowns: Record<string, number>;
  gamePhase: string;
}

export const PERSONALITIES: CommentaryPersonality[] = [
  { id: 'uncle-keung', name: { en: 'Uncle Keung', 'zh-TW': '強叔' }, style: 'casual', excitability: 0.7, verbosity: 0.8 },
  { id: 'professor-wong', name: { en: 'Professor Wong', 'zh-TW': '黃教授' }, style: 'educational', excitability: 0.3, verbosity: 0.9 },
  { id: 'mad-dragon', name: { en: 'Mad Dragon', 'zh-TW': '瘋龍' }, style: 'dramatic', excitability: 1.0, verbosity: 0.6 },
  { id: 'ah-mei', name: { en: 'Ah Mei', 'zh-TW': '阿美' }, style: 'humorous', excitability: 0.6, verbosity: 0.7 },
  { id: 'master-chan', name: { en: 'Master Chan', 'zh-TW': '陳大師' }, style: 'professional', excitability: 0.4, verbosity: 0.5 },
];

// Helper to make line creation less verbose
function ml(id: string, trigger: string, personality: string, en: string, tw: string, cn: string, ja: string, minExcitement: number, cooldown: number): CommentaryLine {
  return { id, trigger, personality, text: { en, 'zh-TW': tw, 'zh-CN': cn, ja }, minExcitement, cooldown };
}

export const COMMENTARY_LINES: CommentaryLine[] = [
  // uncle-keung (casual)
  ml('uk-discard-1', 'discard', 'uncle-keung', 'Just tossing that one out!', '隨便丟一張啦！', '随便丢一张啦！', 'ポイっと捨てた！', 0, 3000),
  ml('uk-pong-1', 'pong', 'uncle-keung', 'Pong! Nice grab!', '碰！接得好！', '碰！接得好！', 'ポン！ナイスキャッチ！', 0.2, 5000),
  ml('uk-kong-1', 'kong', 'uncle-keung', 'Kong! That\'s a big move!', '槓！大動作啊！', '杠！大动作啊！', 'カン！大きな一手！', 0.3, 8000),
  ml('uk-win-1', 'win', 'uncle-keung', 'Winner winner chicken dinner!', '食糊啦！開飯！', '胡了！开饭！', '上がり！ご飯だ！', 0.5, 10000),
  ml('uk-riichi-1', 'riichi', 'uncle-keung', 'Going all in! Bold!', '聽牌啦！夠膽！', '听牌啦！够胆！', 'リーチ！大胆！', 0.4, 6000),
  ml('uk-draw-1', 'draw', 'uncle-keung', 'Let\'s see what we got...', '睇下摸到咩...', '看看摸到啥...', '何が来るかな...', 0, 2000),
  ml('uk-chi-1', 'chi', 'uncle-keung', 'Chi! Smooth move!', '上！順手啊！', '吃！顺手啊！', 'チー！スムーズ！', 0.1, 4000),
  ml('uk-selfdrawn-1', 'self-drawn', 'uncle-keung', 'Self-drawn! Lucky devil!', '自摸！好運到爆！', '自摸！运气爆棚！', 'ツモ！ラッキー！', 0.6, 10000),

  // professor-wong (educational)
  ml('pw-discard-1', 'discard', 'professor-wong', 'An interesting discard choice — note the defensive implications.', '有趣的出牌選擇——注意防守含義。', '有趣的出牌选择——注意防守含义。', '興味深い捨て牌——防御の意味に注目。', 0, 3000),
  ml('pw-pong-1', 'pong', 'professor-wong', 'A pong here accelerates the hand but reveals information.', '碰牌加速了手牌組合，但也暴露了資訊。', '碰牌加速了手牌组合，但也暴露了信息。', 'ポンは手を加速するが情報も漏れる。', 0.1, 5000),
  ml('pw-kong-1', 'kong', 'professor-wong', 'Kong! Extra tile draw — but the risk profile changes significantly.', '槓！多摸一張——但風險大幅改變。', '杠！多摸一张——但风险大幅改变。', 'カン！追加ドロー——リスクが大きく変わる。', 0.2, 8000),
  ml('pw-win-1', 'win', 'professor-wong', 'A well-constructed winning hand. Let\'s analyze the scoring.', '構建完善的胡牌。來分析計分。', '构建完善的胡牌。来分析计分。', '見事な和了。得点を分析しよう。', 0.3, 10000),
  ml('pw-riichi-1', 'riichi', 'professor-wong', 'Declaring ready — a calculated gamble on hand completion.', '宣布聽牌——計算過的賭注。', '宣布听牌——计算过的赌注。', 'リーチ宣言——計算されたギャンブル。', 0.2, 6000),
  ml('pw-draw-1', 'draw', 'professor-wong', 'Each draw shifts the probability landscape.', '每次摸牌都改變概率版圖。', '每次摸牌都改变概率版图。', '毎回のツモが確率を変える。', 0, 2000),
  ml('pw-chi-1', 'chi', 'professor-wong', 'Forming a sequence — efficient but telegraphs the strategy.', '組成順子——高效但暴露策略。', '组成顺子——高效但暴露策略。', 'チー——効率的だが戦略が見える。', 0.1, 4000),
  ml('pw-selfdrawn-1', 'self-drawn', 'professor-wong', 'Self-drawn win — the optimal outcome with bonus scoring.', '自摸——最佳結果加上額外分數。', '自摸——最佳结果加上额外分数。', 'ツモ和了——最高の結果とボーナス。', 0.3, 10000),

  // mad-dragon (dramatic)
  ml('md-discard-1', 'discard', 'mad-dragon', 'CAST INTO THE VOID!', '丟入虛空！', '丢入虚空！', '虚空へ投げ込め！', 0, 3000),
  ml('md-pong-1', 'pong', 'mad-dragon', 'SEIZED! The dragon strikes!', '奪取！龍出擊！', '夺取！龙出击！', '奪取！龍が攻撃！', 0.3, 5000),
  ml('md-kong-1', 'kong', 'mad-dragon', 'ABSOLUTE POWER! KONG!!!', '絕對力量！槓！！！', '绝对力量！杠！！！', '絶対的パワー！カン！！！', 0.4, 8000),
  ml('md-win-1', 'win', 'mad-dragon', 'VICTORYYYY! THE HEAVENS TREMBLE!', '勝利！天地震動！', '胜利！天地震动！', '勝利！天地が震える！', 0.6, 10000),
  ml('md-riichi-1', 'riichi', 'mad-dragon', 'THE GAUNTLET IS THROWN! RIICHI!', '戰書已下！聽牌！', '战书已下！听牌！', '挑戦状だ！リーチ！', 0.5, 6000),
  ml('md-draw-1', 'draw', 'mad-dragon', 'FATE DELIVERS!', '命運降臨！', '命运降临！', '運命が来る！', 0.1, 2000),
  ml('md-chi-1', 'chi', 'mad-dragon', 'SNATCHED FROM THE JAWS!', '從虎口奪食！', '从虎口夺食！', '虎の口から奪う！', 0.2, 4000),
  ml('md-selfdrawn-1', 'self-drawn', 'mad-dragon', 'SELF-DRAWN! DESTINY FULFILLED!', '自摸！命運成就！', '自摸！命运成就！', 'ツモ！運命成就！', 0.7, 10000),

  // ah-mei (humorous)
  ml('am-discard-1', 'discard', 'ah-mei', 'Bye bye~ don\'t come back!', '拜拜～唔好返嚟！', '拜拜～别回来！', 'バイバイ～戻ってこないで！', 0, 3000),
  ml('am-pong-1', 'pong', 'ah-mei', 'Pong! Yoink~ mine now!', '碰！搶嘢～我嘅啦！', '碰！抢东西～我的啦！', 'ポン！もーらい！', 0.2, 5000),
  ml('am-kong-1', 'kong', 'ah-mei', 'Kong! Someone\'s feeling greedy~', '槓！有人好貪心～', '杠！有人好贪心～', 'カン！欲張りさん～', 0.3, 8000),
  ml('am-win-1', 'win', 'ah-mei', 'Winner! Time for bubble tea!', '贏咗！飲珍奶慶祝！', '赢了！喝珍奶庆祝！', '勝ち！タピオカで祝おう！', 0.5, 10000),
  ml('am-riichi-1', 'riichi', 'ah-mei', 'Ooh riichi~ feeling spicy!', '聽牌～好辣啊！', '听牌～好辣啊！', 'リーチ～スパイシー！', 0.3, 6000),
  ml('am-draw-1', 'draw', 'ah-mei', 'Eeny meeny miny moe~', '點指兵兵～', '点兵点将～', 'どれにしようかな～', 0, 2000),
  ml('am-chi-1', 'chi', 'ah-mei', 'Chi! Thanks for the freebie~', '上！多謝請客～', '吃！谢谢请客～', 'チー！ごちそうさま～', 0.1, 4000),
  ml('am-selfdrawn-1', 'self-drawn', 'ah-mei', 'Self-drawn! Main character energy!', '自摸！主角光環！', '自摸！主角光环！', 'ツモ！主人公パワー！', 0.5, 10000),

  // master-chan (professional)
  ml('mc-discard-1', 'discard', 'master-chan', 'Discard noted.', '出牌記錄。', '出牌记录。', '打牌記録。', 0, 3000),
  ml('mc-pong-1', 'pong', 'master-chan', 'Pong claimed. Hand is tightening.', '碰牌。手牌收緊。', '碰牌。手牌收紧。', 'ポン。手が締まる。', 0.2, 5000),
  ml('mc-kong-1', 'kong', 'master-chan', 'Kong declared. High-value play.', '宣布槓牌。高價值操作。', '宣布杠牌。高价值操作。', 'カン宣言。高価値プレイ。', 0.3, 8000),
  ml('mc-win-1', 'win', 'master-chan', 'Game. Clean execution.', '胡牌。乾淨利落。', '胡牌。干净利落。', '和了。見事な実行。', 0.4, 10000),
  ml('mc-riichi-1', 'riichi', 'master-chan', 'Ready hand declared. Endgame begins.', '聽牌宣布。終局開始。', '听牌宣布。终局开始。', 'リーチ宣言。終盤開始。', 0.3, 6000),
  ml('mc-draw-1', 'draw', 'master-chan', 'Drawing.', '摸牌。', '摸牌。', 'ツモ。', 0, 2000),
  ml('mc-chi-1', 'chi', 'master-chan', 'Sequence formed.', '順子完成。', '顺子完成。', '順子形成。', 0.1, 4000),
  ml('mc-selfdrawn-1', 'self-drawn', 'master-chan', 'Self-drawn win. Decisive.', '自摸胡牌。果斷。', '自摸胡牌。果断。', 'ツモ和了。決定的。', 0.5, 10000),
];

export function createCommentaryState(personalityId?: string): CommentaryState {
  const pid = personalityId ?? PERSONALITIES[0].id;
  if (!PERSONALITIES.find(p => p.id === pid)) {
    throw new Error(`Unknown personality: ${pid}`);
  }
  return {
    personality: pid,
    excitement: 0,
    lastLines: [],
    cooldowns: {},
    gamePhase: 'early',
  };
}

export function getAvailableLines(state: CommentaryState, trigger: string): CommentaryLine[] {
  return COMMENTARY_LINES.filter(l => {
    if (l.trigger !== trigger) return false;
    if (l.personality !== state.personality) return false;
    if (state.excitement < l.minExcitement) return false;
    if ((state.cooldowns[l.id] ?? 0) > 0) return false;
    return true;
  });
}

export function triggerCommentary(
  state: CommentaryState,
  event: string,
  context: Record<string, any>,
): { state: CommentaryState; line: string | null } {
  const available = getAvailableLines(state, event);
  if (available.length === 0) return { state, line: null };

  const personality = PERSONALITIES.find(p => p.id === state.personality)!;

  // Pick line — use context.seed for determinism in tests, otherwise first match
  const idx = typeof context.seed === 'number' ? context.seed % available.length : 0;
  const chosen = available[idx];

  const lang = (context.lang as string) ?? 'en';
  const formatted = formatLine(chosen, lang, context.params);

  // Excitement bump based on personality excitability
  const bump = personality.excitability * 0.1;
  const newExcitement = Math.min(1, state.excitement + bump);

  const newState: CommentaryState = {
    ...state,
    excitement: newExcitement,
    lastLines: [...state.lastLines.slice(-9), chosen.id],
    cooldowns: { ...state.cooldowns, [chosen.id]: chosen.cooldown },
  };

  return { state: newState, line: formatted };
}

export function setExcitement(state: CommentaryState, level: number): CommentaryState {
  return { ...state, excitement: Math.max(0, Math.min(1, level)) };
}

export function setGamePhase(state: CommentaryState, phase: string): CommentaryState {
  return { ...state, gamePhase: phase };
}

export function switchPersonality(state: CommentaryState, personalityId: string): CommentaryState {
  if (!PERSONALITIES.find(p => p.id === personalityId)) {
    throw new Error(`Unknown personality: ${personalityId}`);
  }
  return { ...state, personality: personalityId, lastLines: [], cooldowns: {} };
}

export function tickCooldowns(state: CommentaryState, elapsedMs: number): CommentaryState {
  const newCooldowns: Record<string, number> = {};
  for (const [key, val] of Object.entries(state.cooldowns)) {
    const remaining = val - elapsedMs;
    if (remaining > 0) newCooldowns[key] = remaining;
  }
  return { ...state, cooldowns: newCooldowns };
}

export function formatLine(line: CommentaryLine, lang: string, params?: Record<string, string>): string {
  const key = lang as keyof typeof line.text;
  let text = line.text[key] ?? line.text.en;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return text;
}
