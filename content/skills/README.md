# Playbooks

Virtual Garrett's playbooks are the strategy skills from
[garrettjsmith/localseoskills](https://github.com/garrettjsmith/localseoskills) (MIT),
copied here so the site deploys without reaching out to GitHub.

Synced from commit `405ce209775f8cb8f9dbaa511656594bb682cf9f`.

Only the strategy skills plus `localseodata-tool` are included. The other tool
skills (Ahrefs, Semrush, BrightLocal, …) describe tools Virtual Garrett doesn't
have, and `brief` / `dispatch` are replaced by team notes and the playbook
index in `lib/garrett/playbooks.ts`.

To refresh after changing the skills repo:

```bash
git clone --depth 1 https://github.com/garrettjsmith/localseoskills /tmp/lss
npm run playbooks -- --from /tmp/lss/skills
```

Then update the commit hash above. Edits made directly in this folder are
overwritten by the next sync, so make them upstream.
