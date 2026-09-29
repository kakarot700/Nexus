# NEXUS EVIDENCE SYSTEM

`USER_PROVIDED`: text traceable to a specific user input field. The UI shows the exact source field and quote when available.
`DERIVED`: an inference or deterministic classification from existing user input. It is cited and never presented as direct user wording.
`PROPOSED`: a solution, role, need, critic check, or other generated suggestion.
`UNVERIFIED`: a claim without adequate traceable evidence or a fact needing verification.

Evidence status belongs to the field it describes. For a constraint, the exact description/source status is distinct from the category's `categoryStatus`: a keyword category is `DERIVED` (or `UNVERIFIED` for `OTHER`), while an ungrounded model category remains `PROPOSED`. A directly supplied constraint description does not make its computed label a user fact.

Never silently upgrade `UNVERIFIED → FACT` or `PROPOSED → FACT`. Direct problem wording stays authoritative; an analysis paraphrase cannot replace it. Only exact source text can be marked `USER_PROVIDED`. Unsupported output is demoted/dropped, missing context stays unknown, and model references are checked against existing IDs. A valid ID alone does not prove the cited source supports the claim.

Major decisions link only to evidence and constraint IDs that exist. The trail resolves each link to its real source text and provenance; when no supporting object exists, it exposes the uncertainty instead.
