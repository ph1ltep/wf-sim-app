# Cash-Flow Analysis Workspace – Product Requirements Document  
**Version:** Draft v0.10 | **Date:** 2025-05-30  
**Author:** ChatGPT  

---

## 1. Purpose & Vision  
Create a single analyst workspace that converts Monte-Carlo results into clear, actionable insight on **cash timing, financeability, value drivers, and headline project accounts**.  
* A **global percentile lens** (P10 / P25 / P50 / P75 / P90 / Custom) governs all detail views.  
* Supplemental “Σ-meta” widgets aggregate information across percentiles to expose risk spread.  

---

## 2. Scope  

| ✔ In scope (this release) | ✖ Deferred |
|---------------------------|------------|
| • Question 1 – Cash-flow timeline<br>• Question 2 – Financeability dashboard<br>• Question 3 – Driver / sensitivity explorer<br>•  Question 4 – Data-heavy cash-flow table (predicted balance sheet)<br>• Global percentile selector & Σ-meta widgets<br>• Deep-dives: Financing Stress-Tester & O&M Variance Explorer | • Scenario comparison view<br>• Scenario snapshot manager<br>• Portfolio radar |

---

## 3. Personas & Jobs  

| Persona | Core job to be done |
|---------|--------------------|
| **Project-finance analyst** | “Prove the project meets lender covenants at P90 and size the equity slice.” |
| **Sponsor equity lead** | “Understand when cash turns positive and assess IRR under different risk appetites.” |
| **Technical diligence team** | “Pinpoint which technical variables most affect NPV.” |

---

## 4. Experience Overview  

### 4.1 Global Percentile Lens  
Sticky dropdown in the header. Selecting a value refreshes all percentile-dependent views.  
Σ-widgets (marked **Σ**) always analyse *all* percentiles to show variability.

### 4.2 Question-Driven Panels  

| # | Panel | Key elements |
|---|-------|--------------|
| **1** | **Cash-Flow Timeline** | Stacked waterfall-area chart; Σ-ribbon (P10–P90 envelope); hover shows line-item value at selected percentile (+ Σ-spread). |
| **2** | **Financeability Dashboard** | DSCR heat-strip; KPI cards (IRR, NPV, LLCR) for selected percentile + Σ-badges; **Financing Stress-Tester** drawer. |
| **3** | **Driver Explorer** | Interactive tornado (ΔNPV); click bar to highlight driver on timeline; **O&M Variance Explorer** tab with annual box-plots & failure spikes. |
| **4** | **Cash-Flow Table (Predicted Balance Sheet)** | Compact, scrollable table: Revenues, Operating Costs, Financing Charges, Taxes/Fees, Net Cash; cumulative cash column; Σ-columns for P10 & P90 for quick spread check. |

---

## 5. Functional Requirements (intention-focused)  

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-1** | The system shall allow users to choose a percentile lens and have all percentile-sensitive views update near-instantly. | High |
| **FR-2** | The Cash-Flow Timeline shall visualise annual inflows/outflows and highlight variability across percentiles. | High |
| **FR-3** | The Financeability Dashboard shall calculate and display DSCR, LLCR, IRR, NPV for the chosen percentile and flag covenant breaches. | High |
| **FR-4** | The Financing Stress-Tester shall let users alter core debt parameters (e.g., tenor, interest rate) and immediately see revised KPIs. | Medium |
| **FR-5** | The Driver Explorer shall rank input drivers by impact on NPV/IRR and let users focus on individual drivers within other panels. | High |
| **FR-6** | The O&M Variance Explorer shall surface year-on-year cost variability and spotlight outlier years or events. | Medium |
| **FR-7** | The Cash-Flow Table shall present, for each year, a full breakdown from revenues to net cash plus cumulative cash, driven by the selected percentile and accompanied by Σ-columns showing low/high bounds. | High |
| **FR-8** | All panels shall remain usable on screens ≥ 1280 px and degrade gracefully on smaller widths. | Medium |

---

## 6. Data & Integration Notes  
*Specific data formats, storage strategies, and APIs will be defined during development. Design should remain flexible enough to accommodate alternative storage or caching approaches.*

---

## 7. Acceptance Criteria (high-level)  

| Feature | Scenario | Expected outcome |
|---------|----------|------------------|
| Percentile lens | Switch P50 → P90 | All percentile-dependent charts, cards, and table values refresh without perceptible lag; Σ-widgets unchanged. |
| Cash-Flow Table | Scroll to year 2032 | Row shows revenue, each cost category, financing charges, taxes, net cash, cumulative cash; Σ-columns show P10/P90. |
| Financeability | DSCR < covenant | Heat-strip segment turns red and KPI card flagged. |
| Tornado interaction | Click top driver | Driver highlighted on timeline and listed in side panel. |
| Stress-Tester | Decrease tenor | KPI cards update accordingly without full re-run. |

---

## 8. Success Metrics  

* ≥ 80 % of analyst beta testers state they can answer “Is the project financeable at P90?” within 5 minutes.  
* UI responds in < 300 ms for typical 30-year × 50-driver × 5-percentile datasets.  

---

## 9. Open Questions / Risks  

1. Browser memory limits for large percentile datasets—may require lazy loading or server-side aggregation.  
2. Final covenant definitions (DSCR vs ADSCR, LLCR) require sponsor/lender alignment.  
3. Visual accessibility (colour contrast, keyboard nav) to be validated in UX review.  
