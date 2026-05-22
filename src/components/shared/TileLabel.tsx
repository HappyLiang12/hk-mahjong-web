import type { Suit, Tile } from '@/types';

/** Unicode mahjong tile emoji by suit and rank */
const TILE_EMOJI: Record<Suit, Record<number, string>> = {
  wan: {
    1: '\u{1F007}', 2: '\u{1F008}', 3: '\u{1F009}',
    4: '\u{1F00A}', 5: '\u{1F00B}', 6: '\u{1F00C}',
    7: '\u{1F00D}', 8: '\u{1F00E}', 9: '\u{1F00F}',
  },
  tong: {
    1: '\u{1F019}', 2: '\u{1F01A}', 3: '\u{1F01B}',
    4: '\u{1F01C}', 5: '\u{1F01D}', 6: '\u{1F01E}',
    7: '\u{1F01F}', 8: '\u{1F020}', 9: '\u{1F021}',
  },
  tiao: {
    1: '\u{1F010}', 2: '\u{1F011}', 3: '\u{1F012}',
    4: '\u{1F013}', 5: '\u{1F014}', 6: '\u{1F015}',
    7: '\u{1F016}', 8: '\u{1F017}', 9: '\u{1F018}',
  },
  wind: {
    0: '\u{1F000}', 1: '\u{1F001}', 2: '\u{1F002}', 3: '\u{1F003}',
  },
  dragon: {
    0: '\u{1F004}', 1: '\u{1F005}', 2: '\u{1F006}',
  },
  flower: {
    0: '\u{1F022}', 1: '\u{1F023}', 2: '\u{1F024}', 3: '\u{1F025}',
  },
};

const RANK_LABELS_ZH = [
  '', '一', '二', '三', '四', '五', '六', '七', '八', '九',
];

const WIND_LABELS_ZH = ['東', '南', '西', '北'];
const DRAGON_LABELS_ZH = ['中', '發', '白'];
const FLOWER_LABELS_ZH = ['梅', '蘭', '竹', '菊'];

const SUIT_LABELS_ZH: Record<Suit, string> = {
  wan: '萬',
  tong: '筒',
  tiao: '索',
  wind: '',
  dragon: '',
  flower: '',
};

function getTileLabel(tile: Tile): string {
  const { suit, rank } = tile;
  switch (suit) {
    case 'wan':
    case 'tong':
    case 'tiao':
      return `${RANK_LABELS_ZH[rank]}${SUIT_LABELS_ZH[suit]}`;
    case 'wind':
      return WIND_LABELS_ZH[rank] ?? '?';
    case 'dragon':
      return DRAGON_LABELS_ZH[rank] ?? '?';
    case 'flower':
      return FLOWER_LABELS_ZH[rank] ?? '?';
    default:
      return '?';
  }
}

function getTileEmoji(tile: Tile): string {
  return TILE_EMOJI[tile.suit]?.[tile.rank] ?? '\u{1F0CF}'; // 🀏 as fallback
}

export interface TileLabelProps {
  tile: Tile;
  /** Show text label beside emoji */
  showLabel?: boolean;
  /** Additional class name */
  className?: string;
}

export default function TileLabel({
  tile,
  showLabel = true,
  className,
}: TileLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-lg ${className ?? ''}`}
      title={getTileLabel(tile)}
    >
      <span className="text-2xl leading-none" aria-hidden="true">
        {getTileEmoji(tile)}
      </span>
      {showLabel && (
        <span className="text-sm text-neutral-200">{getTileLabel(tile)}</span>
      )}
    </span>
  );
}
