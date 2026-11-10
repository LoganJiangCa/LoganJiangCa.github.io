# Logan Jiang — Personal Portfolio

Live site: https://loganjiangca.github.io/

A static portfolio with Chinese, English, and French navigation. The homepage presents work in AML analytics, statistics and machine learning, solution consulting, and quantitative investing.

## Published financial crime projects

| Project | Entry point | Source deliverable |
| --- | --- | --- |
| Logan's AML Analysis Model | [`projects/aml/`](projects/aml/index.html) | `Profolio/AML OLD/docs/` static application and assets |
| Detecting Insider Trading Risk in Securities Markets | [`projects/insider-trading/`](projects/insider-trading/index.html) | Final standalone HTML from the project's `outputs/` directory |

The AML application uses synthetic demonstration data, retains original rule thresholds and model scores, and explicitly identifies unresolved rules. CSV imports are processed locally in the visitor's browser. The insider trading project distinguishes its research report from its fictional interactive case.

The published project files preserve the original deliverables. Development environments, browser profiles, caches, and private working files are excluded from these project folders.

## Preview and deployment

Serve the repository root with any static HTTP server, for example `python -m http.server 8000`, then open `http://localhost:8000/`.

GitHub Pages publishes the repository root from `main`; no build or backend is required. The root `.nojekyll` file disables Jekyll processing.
