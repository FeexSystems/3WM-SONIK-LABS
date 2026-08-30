import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace any occurrence of `const track = tracksStore.get(id);` with Firestore logic
fetch_track_logic = """
    const doc = await db.collection('tracks').doc(id).get();
    let track = doc.exists ? (doc.data() as Track) : undefined;
"""

# PATCH /api/tracks/:id/settings
content = re.sub(
    r"  app\.patch\('/api/tracks/:id/settings', \(req: Request, res: Response\) => \{\n    const id = Array\.isArray\(req\.params\.id\) \? req\.params\.id\[0\] : req\.params\.id;\n    const track = tracksStore\.get\(id\);\n",
    r"  app.patch('/api/tracks/:id/settings', async (req: Request, res: Response) => {\n    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;\n" + fetch_track_logic,
    content
)

# POST /api/tracks/:id/ai-command
content = re.sub(
    r"  app\.post\('/api/tracks/:id/ai-command', requireAuth, async \(req: Request, res: Response\) => \{\n    const id = Array\.isArray\(req\.params\.id\) \? req\.params\.id\[0\] : req\.params\.id;\n    const track = tracksStore\.get\(id\);\n",
    r"  app.post('/api/tracks/:id/ai-command', requireAuth, async (req: Request, res: Response) => {\n    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;\n" + fetch_track_logic.replace("let track", "let track: Track | undefined"),
    content
)

# POST /api/tracks/:id/master
content = re.sub(
    r"  app\.post\('/api/tracks/:id/master', requireAuth, \(req: Request, res: Response\) => \{\n    const id = Array\.isArray\(req\.params\.id\) \? req\.params\.id\[0\] : req\.params\.id;\n    const track = tracksStore\.get\(id\);\n",
    r"  app.post('/api/tracks/:id/master', requireAuth, async (req: Request, res: Response) => {\n    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;\n" + fetch_track_logic,
    content
)

# GET export quota
content = re.sub(
    r"  app\.get\('/api/projects/:id/export-quota', requireAuth, \(req: Request, res: Response\) => \{\n    const id = Array\.isArray\(req\.params\.id\) \? req\.params\.id\[0\] : req\.params\.id;\n    const track = tracksStore\.get\(id\);\n",
    r"  app.get('/api/projects/:id/export-quota', requireAuth, async (req: Request, res: Response) => {\n    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;\n" + fetch_track_logic,
    content
)

# POST export
content = re.sub(
    r"  app\.post\('/api/projects/:id/exports', requireAuth, async \(req: Request, res: Response\) => \{\n    const \{ id \} = req\.params;\n    const user = \(req as any\)\.user;\n    \n    const track = tracksStore\.get\(id\);\n",
    r"  app.post('/api/projects/:id/exports', requireAuth, async (req: Request, res: Response) => {\n    const { id } = req.params;\n    const user = (req as any).user;\n" + fetch_track_logic,
    content
)

# generate-stem
content = re.sub(
    r"  app\.post\('/api/tracks/:id/generate-stem', requireAuth, async \(req: Request, res: Response\) => \{\n    const id = Array\.isArray\(req\.params\.id\) \? req\.params\.id\[0\] : req\.params\.id;\n    let track = tracksStore\.get\(id\);\n    if \(!track && id === 'demo'\) \{\n       track = tracksStore\.get\('demo'\); // should be initialized by now if called after ai-command\n    \}\n",
    r"  app.post('/api/tracks/:id/generate-stem', requireAuth, async (req: Request, res: Response) => {\n    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;\n    const doc = await db.collection('tracks').doc(id).get();\n    let track = doc.exists ? (doc.data() as Track) : undefined;\n",
    content
)

# Archive
content = re.sub(
    r"  app\.patch\('/api/projects/:id/archive', \(req: Request, res: Response\) => \{\n    const id = Array\.isArray\(req\.params\.id\) \? req\.params\.id\[0\] : req\.params\.id;\n    const track = tracksStore\.get\(id\);\n",
    r"  app.patch('/api/projects/:id/archive', async (req: Request, res: Response) => {\n    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;\n" + fetch_track_logic,
    content
)

# Track Archive
content = re.sub(
    r"  app\.patch\('/api/projects/:id/tracks/:trackId/archive', \(req: Request, res: Response\) => \{\n    const id = Array\.isArray\(req\.params\.id\) \? req\.params\.id\[0\] : req\.params\.id;\n    const track = tracksStore\.get\(id\);\n",
    r"  app.patch('/api/projects/:id/tracks/:trackId/archive', async (req: Request, res: Response) => {\n    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;\n" + fetch_track_logic,
    content
)

# Delete `tracksStore.set(..., track)` entirely
content = re.sub(r"\s*tracksStore\.set\(.*?\);\n", "\n", content)

# Background render logic
old_bg_render = """    const track = (job && tracksStore.get(job.projectId)) || Array.from(tracksStore.values())[0];"""
new_bg_render = """    let track: Track | undefined;
    if (job) {
      const doc = await db.collection('tracks').doc(job.projectId).get();
      if (doc.exists) track = doc.data() as Track;
    }"""
content = content.replace(old_bg_render, new_bg_render)

old_bg_render2 = """      const trackId = (job && job.projectId) || projId || Array.from(tracksStore.keys())[0];
      const track = tracksStore.get(trackId) || Array.from(tracksStore.values())[0];"""
new_bg_render2 = """      const trackId = (job && job.projectId) || projId;
      let track: Track | undefined;
      if (trackId) {
         const doc = await db.collection('tracks').doc(trackId).get();
         if (doc.exists) track = doc.data() as Track;
      }"""
content = content.replace(old_bg_render2, new_bg_render2)

with open("server.ts", "w") as f:
    f.write(content)

