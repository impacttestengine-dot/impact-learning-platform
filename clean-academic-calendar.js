const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "impact--platform-v2",
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function cleanCalendarDocs() {
  const snap = await db.collection("academicCalendars").get();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.months) continue;

    const cleanedMonths = {};

    for (const [month, items] of Object.entries(data.months)) {
      cleanedMonths[month] = (items || []).map(item => {
        if (Array.isArray(item) && item.length >= 3) {
          return [item[0], item[2]];
        }
        return item;
      });
    }

    await doc.ref.set(
      { months: cleanedMonths },
      { merge: true }
    );

    console.log("Cleaned:", doc.id);
  }

  console.log("Done cleaning academic calendar Firestore data.");
}

cleanCalendarDocs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
