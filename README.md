# Logan Jiang — Personal Portfolio

Live site: https://loganjiangca.github.io/

A static portfolio with English, French, and Chinese navigation. The homepage and all four published projects open in English, with language options ordered English, Français, 中文. The homepage presents work in AML analytics, statistics and machine learning, solution consulting, and quantitative investing.

## Published projects

| Project | Entry point | Source deliverable |
| --- | --- | --- |
| Logan's AML Analysis Model | [`projects/aml/`](projects/aml/index.html) | `Profolio/AML OLD/docs/` static application and assets |
| Detecting Insider Trading Risk in Securities Markets | [`projects/insider-trading/`](projects/insider-trading/index.html) | Final standalone HTML from the project's `outputs/` directory |
| Stock Quotes & Technical Analysis | [Open project](Stock%20Quantitative_Tools/Stock%20Quotes%20%26%20Technical%20Analysis.%20bilingual.html) | Standalone HTML in `Stock Quantitative_Tools/` |
| Oversold Reversal Stock Screener | [Open project](Stock%20Quantitative_Tools/%E8%B6%85%E8%B7%8C%E5%8F%8D%E5%BC%B9%E7%9F%AD%E7%BA%BF%E9%80%89%E8%82%A1%E5%99%A8.html) | Standalone HTML in `Stock Quantitative_Tools/` |

The AML application uses synthetic demonstration data, retains original rule thresholds and model scores, and explicitly identifies unresolved rules. CSV imports are processed locally in the visitor's browser. The insider trading project distinguishes its research report from its fictional interactive case.

The published projects preserve their original analysis logic and source parameters while providing translated interfaces. Development environments, browser profiles, caches, and private working files are excluded from these project folders.

## Preview and deployment

Serve the repository root with any static HTTP server, for example `python -m http.server 8000`, then open `http://localhost:8000/`.

GitHub Pages publishes the repository root from `main`; no build or backend is required. The root `.nojekyll` file disables Jekyll processing.
