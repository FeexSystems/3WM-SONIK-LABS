import re

with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "r") as f:
    content = f.read()

content = content.replace("import { soundEngine } from '../../audio/engine';\n\nexport const AudioEngineDiagnosticOverlay", "export const AudioEngineDiagnosticOverlay")

with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "w") as f:
    f.write(content)

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("await admin.auth().verifyIdToken(token);", "await getAuth().verifyIdToken(token);")
if "import { getAuth } from 'firebase-admin/auth';" not in content:
    content = content.replace("import { getFirestore } from 'firebase-admin/firestore';", "import { getFirestore } from 'firebase-admin/firestore';\nimport { getAuth } from 'firebase-admin/auth';")

with open("server.ts", "w") as f:
    f.write(content)

