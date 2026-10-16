# FANTASY LIFE SIMULATOR — R1 gameplay depth preview

無料・ブラウザ完結の戦闘人生シミュレーション。

現在のR1プレビューは、幼少期〜学院〜配属〜戦場〜死亡の長期的な因果を重視した開発版です。

- `index.html` or `dist/index.html` — 単一ファイル版（本番GitHub Pagesでは R0 のまま）。
- `src` — ソース、6役割の担当境界に従ってファイル分離。
- `tests/core.test.js`, `tests/r1-depth.test.js` — 22単体・統合テスト。
- `tests/r1-balance-report.js` — 1,000人生分布検証。
- `docs/R1_TEST_REPORT.md` — 今回の検証記録。

Local commands: `npm test`, `npm run build:standalone`, `node tests/r1-balance-report.js 1000`.

## R1.1 — 年表と戦績
新機能: 年齢章構成の年表、戦闘の勝算・敵戦力・戦功チップ、年表フィルタ、年間記録、人生の数字14指標、能力・健康・戦功・名声の推移。過去セーブは維持。

参照: `docs/R1_CHRONICLE_HANDOFF.md`。
