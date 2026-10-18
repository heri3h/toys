<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Mandatory Deployment Workflow (Workflow Wajib Setiap Perubahan)
Setiap kali selesai mengubah atau membuat sesuatu pada kode proyek ini:
1. **Commit & Push ke Git**:
   `git add . && git commit -m "..." && git push origin main`
2. **Build Standalone di Mac**:
   `npm run build`
   `cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/`
3. **Deploy & Sync ke VPS**:
   `rsync -avz --delete .next/standalone/ ubuntu@vps.spotgames.top:/home/mbummm/web/toys.gledeg.com/node_app/`
4. **Restart PM2 di VPS**:
   `ssh ubuntu@vps.spotgames.top "sudo chown -R mbummm:mbummm /home/mbummm/web/toys.gledeg.com/node_app && sudo su - mbummm -c 'pm2 restart toys'"`
