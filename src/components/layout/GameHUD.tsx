import type { ReactNode } from 'react';

/**
 * GameHUD provides an HTML overlay skeleton on top of the 3D game canvas.
 *
 * Zones (absolute positioned, empty by default, filled by DEV-F):
 *   - topBar:    top center — round info, wind, dealer
 *   - bottomBar: bottom center — hand controls (draw/discard)
 *   - actionBar: above bottomBar — claim/pong/chow/kong/win/pass
 *   - leftPanel: left side — opponent 1 info
 *   - rightPanel: right side — opponent 2 info
 *   - topPanel:  top opponent — opponent 3 info (sits across)
 *
 * Each zone renders children passed via props. Pass null to hide a zone.
 */

export interface GameHUDProps {
  topBar?: ReactNode;
  bottomBar?: ReactNode;
  actionBar?: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  topPanel?: ReactNode;
  /** Additional CSS class on the overlay container */
  className?: string;
}

export default function GameHUD({
  topBar,
  bottomBar,
  actionBar,
  leftPanel,
  rightPanel,
  topPanel,
  className,
}: GameHUDProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 select-none ${className ?? ''}`}
    >
      {/* ── Top bar ── */}
      <div className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-center justify-center px-4 py-2">
        <div className="rounded-xl bg-neutral-900/85 px-5 py-2 shadow-lg backdrop-blur border border-neutral-700/50">
          {topBar ?? (
            <span className="text-sm text-neutral-500 italic">
              頂部資訊區（由 DEV-F 實現）
            </span>
          )}
        </div>
      </div>

      {/* ── Top opponent panel ── */}
      {topPanel !== null && (
        <div className="pointer-events-auto absolute inset-x-0 top-16 z-10 flex justify-center">
          <div className="rounded-lg bg-neutral-900/80 px-4 py-2 backdrop-blur border border-neutral-700/40">
            {topPanel ?? (
              <span className="text-xs text-neutral-500 italic">
                對家資訊
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Left panel ── */}
      {leftPanel !== null && (
        <div className="pointer-events-auto absolute left-4 top-1/3 z-10 flex flex-col items-center">
          <div className="rounded-lg bg-neutral-900/80 px-3 py-6 backdrop-blur border border-neutral-700/40">
            {leftPanel ?? (
              <span className="text-xs text-neutral-500 italic [writing-mode:vertical-rl]">
                上家資訊
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Right panel ── */}
      {rightPanel !== null && (
        <div className="pointer-events-auto absolute right-4 top-1/3 z-10 flex flex-col items-center">
          <div className="rounded-lg bg-neutral-900/80 px-3 py-6 backdrop-blur border border-neutral-700/40">
            {rightPanel ?? (
              <span className="text-xs text-neutral-500 italic [writing-mode:vertical-rl]">
                下家資訊
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Action bar (claim/pong/chow/kong/win/pass) ── */}
      {actionBar !== null && (
        <div className="pointer-events-auto absolute bottom-32 inset-x-0 z-20 flex justify-center">
          <div className="rounded-xl bg-neutral-900/85 px-5 py-3 shadow-lg backdrop-blur border border-amber-700/40">
            {actionBar ?? (
              <span className="text-sm text-neutral-500 italic">
                鳴牌操作區（碰/食/槓/胡/過）
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom bar (hand controls) ── */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex items-center justify-center pb-4 pt-2">
        <div className="rounded-xl bg-neutral-900/85 px-6 py-3 shadow-lg backdrop-blur border border-neutral-700/50">
          {bottomBar ?? (
            <span className="text-sm text-neutral-500 italic">
              手牌操作區（摸牌/出牌）
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
