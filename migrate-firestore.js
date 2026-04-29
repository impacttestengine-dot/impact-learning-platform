const admin = require("firebase-admin");

const OLD_PROJECT_ID = "impact-test-engine";
const NEW_PROJECT_ID = "impact--platform-v2";

const oldApp = admin.initializeApp({
  projectId: OLD_PROJECT_ID,
  credential: admin.credential.applicationDefault()
}, "old");

const newApp = admin.initializeApp({
  projectId: NEW_PROJECT_ID,
  credential: admin.credential.applicationDefault()
}, "new");

const oldDb = oldApp.firestore();
const newDb = newApp.firestore();

let copied = 0;

async function copyDoc(oldRef, newRef) {
  const snap = await oldRef.get();

  if (snap.exists) {
    await newRef.set(snap.data(), { merge: true });
    copied++;
    console.log("Copied:", oldRef.path);
  }

  const subs = await oldRef.listCollections();

  for (const sub of subs) {
    const subSnap = await sub.get();

    for (const subDoc of subSnap.docs) {
      await copyDoc(
        oldRef.collection(sub.id).doc(subDoc.id),
        newRef.collection(sub.id).doc(subDoc.id)
      );
    }
  }
}

async function migrate() {
  const collections = await oldDb.listCollections();

  for (const col of collections) {
    console.log("Collection:", col.id);

    const snap = await col.get();

    for (const doc of snap.docs) {
      await copyDoc(
        oldDb.collection(col.id).doc(doc.id),
        newDb.collection(col.id).doc(doc.id)
      );
    }
  }

  console.log("");
  console.log("Migration complete.");
  console.log("Total documents copied:", copied);
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("MIGRATION FAILED");
    console.error(err);
    process.exit(1);
  });
