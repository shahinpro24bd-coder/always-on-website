<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Reuse TeamBrand for site identity across public and authenticated screens so branding stays consistent.
- Use semantic global theme tokens and unframed workspace sections for dashboard presentation; preserve existing lead ownership and operations when restyling.
- Keep original imported lead records in a private, RLS-locked archive; import into leads without reassigning user IDs so account recovery can preserve ownership.
- Expose imported links through the authenticated previous_version_leads projection, never grant archive reads; this keeps original PII locked.
- Admin functions verify user_roles through the authenticated client before importing the privileged client; role ownership cannot come from browser state.
- Persist submission activity independently of leads and preserve leads on account removal so account deletion does not destroy historical records.
