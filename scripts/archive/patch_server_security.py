import re

with open("server.ts", "r") as f:
    content = f.read()

# Add requireAuth import
import_stmt = "import { requireAuth } from './src/middleware/auth';\n"
if "requireAuth" not in content:
    content = content.replace("import cors from 'cors';", "import cors from 'cors';\n" + import_stmt)
    
# Secure Express CORS
new_cors = """
  const allowedOrigins = ['http://localhost:3000'];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
"""
content = re.sub(r"app\.use\(cors\(\)\);", new_cors.strip(), content)

# Secure Socket CORS and add auth middleware
new_socket_init = """
  io = new SocketIOServer(server, {
    cors: { 
      origin: (origin, callback) => {
        if (!origin || origin === 'http://localhost:3000' || origin.endsWith('.run.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }
      const decodedToken = await admin.auth().verifyIdToken(token);
      (socket as any).user = decodedToken;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
"""
content = re.sub(
    r"io = new SocketIOServer\(server, \{\n\s*cors: \{ origin: '\*', methods: \['GET', 'POST'\] \}\n\s*\}\);\n\n\s*io\.on\('connection', \(socket\) => \{",
    new_socket_init.strip(),
    content
)

# Apply requireAuth to tracks/exports routes
# Let's find all app.post('/api/...
content = re.sub(r"app\.post\('/api/tracks", r"app.post('/api/tracks', requireAuth, ", content)
content = re.sub(r"app\.get\('/api/tracks", r"app.get('/api/tracks', requireAuth, ", content)
content = re.sub(r"app\.post\('/api/projects", r"app.post('/api/projects', requireAuth, ", content)
content = re.sub(r"app\.get\('/api/projects", r"app.get('/api/projects', requireAuth, ", content)

# Also check for authorization scoping. For example, in export route:
old_export = """  app.post('/api/projects/:id/exports', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;"""
new_export = """  app.post('/api/projects/:id/exports', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    
    const track = tracksStore.get(id);
    if (!track) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (track.userId !== user.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this project' });
    }"""
content = content.replace(
    "  app.post('/api/projects/:id/exports', requireAuth, async (req: Request, res: Response) => {\n    const { id } = req.params;\n",
    new_export
)

with open("server.ts", "w") as f:
    f.write(content)
