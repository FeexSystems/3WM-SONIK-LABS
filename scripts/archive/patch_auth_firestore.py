import re

with open("src/lib/firebase-admin.ts", "r") as f:
    content = f.read()

if "getFirestore" not in content:
    content = content.replace("import { getAuth } from 'firebase-admin/auth';", "import { getAuth } from 'firebase-admin/auth';\nimport { getFirestore } from 'firebase-admin/firestore';")
    content += "\nexport const adminDb = getFirestore();"
    with open("src/lib/firebase-admin.ts", "w") as f:
        f.write(content)

with open("src/middleware/auth.ts", "r") as f:
    content = f.read()

content = content.replace("import { getOrCreateUser } from '../db/users';", "import { adminDb } from '../lib/firebase-admin';")

new_get_or_create = """
async function getOrCreateUser(uid: string, email: string, name?: string, avatar?: string) {
  const userRef = adminDb.collection('users').doc(uid);
  const doc = await userRef.get();
  const data = {
    uid,
    email,
    name: name || '',
    avatar: avatar || '',
    updatedAt: new Date().toISOString()
  };
  if (!doc.exists) {
    await userRef.set({ ...data, role: 'Artist', createdAt: new Date().toISOString() });
  } else {
    await userRef.update(data);
  }
  return { ...(doc.data() || {}), ...data };
}
"""

content = content.replace("export interface AuthRequest", new_get_or_create + "\nexport interface AuthRequest")

with open("src/middleware/auth.ts", "w") as f:
    f.write(content)

