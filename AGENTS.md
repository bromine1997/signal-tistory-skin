# Repository instructions

Before modifying this repository, read `HANDOFF.md` and `README.md` completely.

- Treat `index.xml` as the source of truth for the current skin version.
- Preserve Tistory placeholders (`[##_..._##]`) and conditional elements (`<s_...>`).
- Do not hardcode personal names, emails, GitHub links, portfolio links, or technology stacks.
- Content migration is outside this repository; the user handles it directly.
- Keep the UI focused. Do not add popular-post, notice, or infinite-scroll features without an explicit request.
- Validate changes with `git diff --check`, `node --check images/script.js`, and an XML parser.
- Check desktop and mobile rendering for layout changes.
- A GitHub push does not deploy the skin to Tistory. Build a ZIP and apply it manually.

