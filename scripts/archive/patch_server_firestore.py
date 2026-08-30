import re

with open("server.ts", "r") as f:
    content = f.read()

# 1. Remove tracksStore completely
content = re.sub(r"const tracksStore = new Map<string, Track>\(\);\n", "", content)
content = re.sub(r"const initialTracks: Track\[\] = \[.*?\];\n\ninitialTracks\.forEach\(\(t\) => tracksStore\.set\(t\.id, t\)\);\n", "", content, flags=re.DOTALL)

# 2. Modify API health
content = content.replace("activeTracks: tracksStore.size,", "activeTracks: 0, // Migrated to Firestore")

# 3. GET /api/tracks/:id
old_get_track = """  app.get('/api/tracks/:id', requireAuth, async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    let track = tracksStore.get(id);
    if (!track) {
      try {
        const doc = await db.collection('tracks').doc(id).get();
        if (doc.exists) {
          track = doc.data() as Track;
          tracksStore.set(id, track);
      syncToDB(track);
        } else {
          return res.status(404).json({ error: 'Track not found' });
        }
      } catch (e) {
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

# 4. GET /api/tracks
old_get_tracks = """  app.get('/api/tracks', requireAuth, (req: Request, res: Response) => {
    const list = Array.from(tracksStore.values());
    res.json(list);
  });"""
new_get_tracks = """  app.get('/api/tracks', requireAuth, async (req: Request, res: Response) => {
    try {
       const user = (req as any).user;
       // Scope to user if possible, for now just get all tracks (or limit)
       const snapshot = await db.collection('tracks').where('userId', '==', user.uid).get();
       const list = snapshot.docs.map(doc => doc.data() as Track);
       res.json(list);
    } catch(e) {
       res.status(500).json({ error: 'Failed to fetch tracks' });
    }
  });"""
content = content.replace(old_get_tracks, new_get_tracks)

# 5. POST /api/tracks
old_post_track = """    tracksStore.set(newTrack.id, newTrack);
    res.status(201).json(newTrack);"""
new_post_track = """    await syncToDB(newTrack);
    res.status(201).json(newTrack);"""
content = content.replace(old_post_track, new_post_track)

# We will need to replace tracksStore.get(id) with await db.collection('tracks').doc(id).get() for all other endpoints
# Let's do this in a generalized way for all endpoints
