import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("  app.post('/api/tracks', requireAuth, /:id/generate-stem', async", "  app.post('/api/tracks/:id/generate-stem', requireAuth, async")
content = content.replace("  app.get('/api/tracks', requireAuth, ', (req: Request", "  app.get('/api/tracks', requireAuth, (req: Request")
content = content.replace("  app.get('/api/tracks', requireAuth, /:id', async", "  app.get('/api/tracks/:id', requireAuth, async")
content = content.replace("  app.post('/api/tracks', requireAuth, ', (req: Request", "  app.post('/api/tracks', requireAuth, (req: Request")
content = content.replace("  app.post('/api/tracks', requireAuth, /:id/ai-command', async", "  app.post('/api/tracks/:id/ai-command', requireAuth, async")
content = content.replace("  app.post('/api/tracks', requireAuth, /:id/master', (req: Request", "  app.post('/api/tracks/:id/master', requireAuth, (req: Request")
content = content.replace("  app.get('/api/projects', requireAuth, /:id/export-quota', (req: Request", "  app.get('/api/projects/:id/export-quota', requireAuth, (req: Request")
content = content.replace("  app.post('/api/projects', requireAuth, /:id/exports', async", "  app.post('/api/projects/:id/exports', requireAuth, async")

with open("server.ts", "w") as f:
    f.write(content)

