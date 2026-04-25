const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: [
    "https://impact-test-engine.web.app",
    "https://impact-test-engine.firebaseapp.com",
    "http://localhost:5000",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PATCH"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials are missing.");
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

initFirebaseAdmin();

function getDb() {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin is not initialized.");
  }
  return admin.firestore();
}

function generatePasskey() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "$&";

  const partA = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const partB = Array.from({ length: 3 }, () => numbers[Math.floor(Math.random() * numbers.length)]).join("");
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const partC = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");

  return `IMP-${partA}${symbol}${partB}-${partC}`;
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Impact Learning Platform Backend",
    status: "running"
  });
});

app.post("/api/passkeys/create", async (req, res) => {
  try {
    const { ownerName, role, status } = req.body;

    if (!ownerName || !role) {
      return res.status(400).json({
        ok: false,
        message: "ownerName and role are required."
      });
    }

    const teamRoles = ["teacher", "academic-team-lead", "operations", "impact-team-lead"];
    const isTeamRole = teamRoles.includes(role);
    const passkey = generatePasskey();
    const db = getDb();

    const docRef = await db.collection("accessPasskeys").add({
      ownerName,
      role,
      passkey,
      status: status || "active",
      accessScope: isTeamRole ? "team" : "learner",
      canAccessTeacher: isTeamRole,
      canAccessLearner: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      ok: true,
      id: docRef.id,
      passkey
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not create passkey."
    });
  }
});

app.post("/api/passkeys/validate", async (req, res) => {
  try {
    const { passkey, targetSide } = req.body;

    if (!passkey || !targetSide) {
      return res.status(400).json({
        ok: false,
        message: "passkey and targetSide are required."
      });
    }

    const db = getDb();

    const snapshot = await db.collection("accessPasskeys")
      .where("passkey", "==", String(passkey).trim())
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        ok: false,
        message: "Invalid passkey."
      });
    }

    const record = snapshot.docs[0].data();

    if (targetSide === "teacher" && record.canAccessTeacher !== true) {
      return res.status(403).json({
        ok: false,
        message: "This passkey cannot open the teacher side."
      });
    }

    if (targetSide === "learner" && record.canAccessLearner !== true) {
      return res.status(403).json({
        ok: false,
        message: "This passkey cannot open the learner side."
      });
    }

    res.json({
      ok: true,
      role: record.role,
      ownerName: record.ownerName || "",
      message: "Access granted."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not validate passkey."
    });
  }
});

app.post("/api/classes/create", async (req, res) => {
  try {
    const db = getDb();

    const classData = {
      ...req.body,
      status: req.body.status || "Scheduled",
      googleCalendarEventId: "",
      googleMeetSpaceName: "",
      googleMeetConferenceRecord: "",
      startedAt: "",
      completedAt: "",
      actualDurationMinutes: "",
      reviewReason: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("classes").add(classData);

    res.json({
      ok: true,
      id: docRef.id,
      message: "Class created."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not create class."
    });
  }
});

app.patch("/api/classes/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewReason, actualDurationMinutes } = req.body;

    const db = getDb();

    await db.collection("classes").doc(id).update({
      status,
      reviewReason: reviewReason || "",
      actualDurationMinutes: actualDurationMinutes || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      ok: true,
      message: "Class updated."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not update class."
    });
  }
});


// RECORDS API START
app.get("/api/records", async (req, res) => {
  try {
    const db = getDb();

    const snapshot = await db.collection("learners")
      .orderBy("createdAt", "desc")
      .get();

    const records = [];
    snapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      ok: true,
      records
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not load records."
    });
  }
});

app.post("/api/records/create", async (req, res) => {
  try {
    const db = getDb();

    const record = {
      fullName: req.body.fullName || "",
      age: req.body.age || "",
      enrollmentDate: req.body.enrollmentDate || "",
      level: req.body.level || "",
      placementResult: req.body.placementResult || "",
      progressionCount: req.body.progressionCount || "0",
      teacher: req.body.teacher || "",
      parentName: req.body.parentName || "",
      parentPhone: req.body.parentPhone || "",
      parentEmail: req.body.parentEmail || "",
      classDays: req.body.classDays || "",
      status: req.body.status || "Active",
      notes: req.body.notes || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("learners").add(record);

    res.json({
      ok: true,
      id: docRef.id,
      message: "Record created."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not create record."
    });
  }
});

app.put("/api/records/:id", async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const record = {
      fullName: req.body.fullName || "",
      age: req.body.age || "",
      enrollmentDate: req.body.enrollmentDate || "",
      level: req.body.level || "",
      placementResult: req.body.placementResult || "",
      progressionCount: req.body.progressionCount || "0",
      teacher: req.body.teacher || "",
      parentName: req.body.parentName || "",
      parentPhone: req.body.parentPhone || "",
      parentEmail: req.body.parentEmail || "",
      classDays: req.body.classDays || "",
      status: req.body.status || "Active",
      notes: req.body.notes || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("learners").doc(id).update(record);

    res.json({
      ok: true,
      message: "Record updated."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not update record."
    });
  }
});
// RECORDS API END

// CLASSES API START
app.get("/api/classes", async (req, res) => {
  try {
    const db = getDb();

    const snapshot = await db.collection("classes")
      .orderBy("createdAt", "desc")
      .get();

    const classes = [];

    snapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      ok: true,
      classes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not load classes."
    });
  }
});

app.post("/api/classes/create", async (req, res) => {
  try {
    const db = getDb();

    const meetLinks = [
      "https://meet.google.com/ukw-macm-cvo",
      "https://meet.google.com/fxh-gazg-jpp",
      "https://meet.google.com/rps-qrqe-upw",
      "https://meet.google.com/mea-ihvu-jhi"
    ];

    const assignedMeetLink = req.body.meetingLink || meetLinks[Math.floor(Math.random() * meetLinks.length)];

    const classData = {
      classTitle: req.body.classTitle || "",
      learnerGroup: req.body.learnerGroup || "",
      teacher: req.body.teacher || "",
      classDay: req.body.classDay || "",
      time: req.body.time || "",
      duration: req.body.duration || "",
      meetingLink: assignedMeetLink,
      status: req.body.status || "Scheduled",
      notes: req.body.notes || "",
      startedAt: "",
      completedAt: "",
      actualDurationMinutes: "",
      reviewReason: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("classes").add(classData);

    res.json({
      ok: true,
      id: docRef.id,
      meetingLink: assignedMeetLink,
      message: "Class created."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not create class."
    });
  }
});

app.patch("/api/classes/:id/status", async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    await db.collection("classes").doc(id).update({
      status: req.body.status || "Updated",
      reviewReason: req.body.reviewReason || "",
      actualDurationMinutes: req.body.actualDurationMinutes || "",
      completedAt: req.body.completedAt || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      ok: true,
      message: "Class updated."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not update class."
    });
  }
});
// CLASSES API END
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Impact backend running on port ${PORT}`);
});




