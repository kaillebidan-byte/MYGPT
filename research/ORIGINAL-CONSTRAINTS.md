# MYGPT original constraints

Date clarified: 2026-08-08

This project originally started from the question of whether the desired Pet-feature delta could be produced without consuming the user's weekly token allowance.

Primary constraint for future design decisions:

- Do not assume ChatGPT Work is available or acceptable.
- Do not make ChatGPT Work a prerequisite for production.
- Do not make OpenAI API / Agents SDK / Responses API usage a prerequisite for production unless the user explicitly relaxes this constraint.
- API usage is separately billed from ChatGPT and therefore is not a substitute for the original zero-weekly-token objective; treat it only as an optional comparison/proof path if explicitly approved.
- Prefer solutions that stay inside the normal ChatGPT Project / Pet-feature path being tested.
- Preserve the distinction between (a) proving an architecture externally and (b) satisfying the actual product constraint. External proof does not count as solving the original goal.

Current implication:

The external planner/worker isolation proposal remains technically informative, but it is not the next production-path experiment under the original constraint. Before proposing the next experiment, search for existing examples that achieve context separation or equivalent behavior inside ordinary ChatGPT / Project usage without Work or separately billed API execution.
