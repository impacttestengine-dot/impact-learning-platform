const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const multer = require("multer");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  });
}

function getDb() {
  return admin.firestore();
}

function minutesFromTime(timeValue) {
  const parts = String(timeValue || "").split(":");
  if (parts.length < 2) return null;
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function durationMinutes(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 60;
}

function overlaps(startA, durationA, startB, durationB) {
  const endA = startA + durationA;
  const endB = startB + durationB;
  return startA < endB && startB < endA;
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Impact Learning Platform Backend",
    status: "running"
  });
});

/* RECORDS API */
app.get("/api/records", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("records").orderBy("createdAt", "desc").get();

    const records = [];
    snapshot.forEach((doc) => records.push({ id: doc.id, ...doc.data() }));

    res.json({ ok: true, records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not load records." });
  }
});

app.post("/api/records/create", async (req, res) => {
  try {
    const db = getDb();

    const recordData = {
      fullName: req.body.fullName || "",
      age: req.body.age || "",
      enrollmentDate: req.body.enrollmentDate || "",
      currentLevel: req.body.currentLevel || "",
      assignedTeacher: req.body.assignedTeacher || "",
      parentGuardian: req.body.parentGuardian || "",
      parentPhone: req.body.parentPhone || "",
      parentEmail: req.body.parentEmail || "",
      classDays: req.body.classDays || "",
      placement: req.body.placement || "",
      progressions: req.body.progressions || 0,
      status: req.body.status || "Active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("records").add(recordData);

    res.json({
      ok: true,
      id: docRef.id,
      message: "Record created."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not create record." });
  }
});

app.patch("/api/records/:id", async (req, res) => {
  try {
    const db = getDb();

    await db.collection("records").doc(req.params.id).update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: "Record updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not update record." });
  }
});

/* CLASSES API */
app.get("/api/classes", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("classes").orderBy("createdAt", "desc").get();

    const classes = [];
    snapshot.forEach((doc) => classes.push({ id: doc.id, ...doc.data() }));

    res.json({ ok: true, classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not load classes." });
  }
});

app.post("/api/classes/create", async (req, res) => {
  try {
    const db = getDb();

    const classDay = req.body.classDay || "";
    const time = req.body.time || "";
    const duration = req.body.duration || "";
    const meetingLink = req.body.meetingLink || "";

    if (!meetingLink) {
      return res.status(400).json({
        ok: false,
        message: "Please select a Google Meet room."
      });
    }

    const newStart = minutesFromTime(time);
    const newDuration = durationMinutes(duration);

    const snapshot = await db.collection("classes")
      .where("classDay", "==", classDay)
      .where("meetingLink", "==", meetingLink)
      .get();

    let roomConflict = false;

    snapshot.forEach((doc) => {
      const item = doc.data();
      const status = item.status || "Scheduled";

      if (!["Scheduled", "In Progress"].includes(status)) return;

      const existingStart = minutesFromTime(item.time);
      const existingDuration = durationMinutes(item.duration);

      if (
        newStart !== null &&
        existingStart !== null &&
        overlaps(newStart, newDuration, existingStart, existingDuration)
      ) {
        roomConflict = true;
      }
    });

    if (roomConflict) {
      return res.status(409).json({
        ok: false,
        message: "This Google Meet room is unavailable at this period. Please choose another room."
      });
    }

    const classData = {
      classTitle: req.body.classTitle || "",
      learnerGroup: req.body.learnerGroup || "",
      teacher: req.body.teacher || "",
      classDay,
      time,
      duration,
      meetingLink,
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
      meetingLink,
      message: "Class created."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not create class." });
  }
});

app.patch("/api/classes/:id/start", async (req, res) => {
  try {
    const db = getDb();

    await db.collection("classes").doc(req.params.id).update({
      status: "In Progress",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: "Class started." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not start class." });
  }
});

app.patch("/api/classes/:id/end", async (req, res) => {
  try {
    const db = getDb();

    await db.collection("classes").doc(req.params.id).update({
      status: req.body.status || "Completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      actualDurationMinutes: req.body.actualDurationMinutes || "",
      reviewReason: req.body.reviewReason || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: "Class ended and logged." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not end class." });
  }
});

/* RECORDINGS API */
app.get("/api/recordings", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("recordings").orderBy("createdAt", "desc").get();

    const recordings = [];
    snapshot.forEach((doc) => recordings.push({ id: doc.id, ...doc.data() }));

    res.json({ ok: true, recordings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Could not load recordings." });
  }
});

app.post("/api/recordings/upload", upload.single("recording"), async (req, res) => {
  try {
    const db = getDb();

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "No recording file uploaded."
      });
    }

    const level = req.body.level || "Unsorted";
    const title = req.body.title || req.file.originalname;
    const teacher = req.body.teacher || "";
    const learnerGroup = req.body.learnerGroup || "";
    const notes = req.body.notes || "";
    const fileType = req.file.mimetype || "application/octet-stream";

    const safeLevel = level.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `recordings/${safeLevel}/${Date.now()}-${safeName}`;

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: fileType
      },
      resumable: false
    });

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2035"
    });

    const recordingData = {
      level,
      title,
      teacher,
      learnerGroup,
      notes,
      fileName: req.file.originalname,
      fileType,
      filePath,
      publicUrl: signedUrl,
      status: "Uploaded",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("recordings").add(recordingData);

    res.json({
      ok: true,
      id: docRef.id,
      recording: recordingData,
      message: "Recording uploaded."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Could not upload recording."
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Impact backend running on port ${PORT}`);
});
