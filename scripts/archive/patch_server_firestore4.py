import re

with open("server.ts", "r") as f:
    content = f.read()

old_get_track = """  app.get('/api/tracks/:id', requireAuth, async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    let track = tracksStore.get(id);
    if (!track) {
      try {
        const doc = await db.collection('tracks').doc(id).get();
        if (doc.exists) {
          track = doc.data() as Track;
      syncToDB(track);
        } else {
          return res.status(404).json({ error: 'Track not found' });
        }
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to fetch from DB' });
      }
    }
    res.json(track);
  });"""
new_get_track = """  app.get('/api/tracks/:id', requireAuth, async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
      const doc = await db.collection('tracks').doc(id).get();
      if (doc.exists) {
        res.json(doc.data() as Track);
      } else {
        res.status(404).json({ error: 'Track not found' });
      }
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch from DB' });
    }
  });"""

content = content.replace(old_get_track, new_get_track)
content = re.sub(r"let track = tracksStore\.get\(id\);", "let track: any = null;", content)

with open("server.ts", "w") as f:
    f.write(content)
