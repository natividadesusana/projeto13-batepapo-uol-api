import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { stripHtml } from "string-strip-html";


// Server creation
const app = express();


// Settings
app.use(express.json()); // determines that HTTP communication will be done using .json type files
app.use(cors()); // allows our API to be used by front-end clients
dotenv.config(); // is used to load environment variables from a .env file, may contain sensitive information


// Database setup
const mongoClient = new MongoClient(process.env.DATABASE_URL);
try {
  await mongoClient.connect();
  console.log("MongoDB Connected!");
} catch (error) {
  console.log(error.message);
}
const db = mongoClient.db();


// This adds the UTC and timezone plugins to dayjs, allowing the use of timezones in the application
dayjs.extend(utc);
dayjs.extend(timezone);


// ---------- AUTOMATIC REMOVAL OF INACTIVE USERS
setInterval(async () => {
  try {
    const timeLimit = dayjs().subtract(10, "seconds").valueOf();
    const deletedParticipants = await db
      .collection("participants")
      .findOneAndDelete({ lastStatus: { $lt: timeLimit } });

    if (deletedParticipants.value) {
      const participantName = deletedParticipants.value.name;
      const message = {
        from: participantName,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: dayjs().tz("America/Sao_Paulo").format("HH:mm:ss"),
      };

      await db
        .collection("participants")
        .updateOne(
          { name: participantName },
          { $set: { lastStatus: Date.now() } }
        );

      await db.collection("messages").insertOne(message);
    }
  } catch (error) {
    console.error(error.message);
  }
}, 15000);


// Endpoints

// ---------- POST /PARTICIPANTS
app.post("/participants", async (req, res) => { // req (request information) & res (reply information we will send)
  const name = stripHtml(req.body.name.trim()).result;
  const schema = Joi.object({
    name: Joi.string().trim().min(1).required(),
  });

  const validation = schema.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const participant = {
      name: name,
      lastStatus: Date.now(),
    };
    

    const existingParticipant = await db
      .collection("participants")
      .findOne({ name: participant.name });

    if (existingParticipant) {
      return res.status(409).send({ message: "Participant already exists!" });
    }

    await db.collection("participants").insertOne(participant);

    const message = {
      from: participant.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().tz("America/Sao_Paulo").format("HH:mm:ss"),
    };

    await db.collection("messages").insertOne(message);

    res.status(201).send();
  } catch (error) {
    console.error(error.message);
    res.status(422).send({ message: error.message });
  }
});


// ---------- GET /PARTICIPANTS
app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants || []);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: "Internal Server Error!" });
  }
});


// ---------- POST /MESSAGES
app.post("/messages", async (req, res) => {
  const schema = Joi.object({
    to: Joi.string().trim().min(1).required(),
    text: Joi.string().trim().min(1).required(),
    type: Joi.string().valid("message", "private_message").required(),
  });

  const validation = schema.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  const from = req.header("User");

  const existingParticipant = await db
    .collection("participants")
    .findOne({ name: from });
  if (!existingParticipant) {
    return res.status(422).send({ message: "Participant does not exist!" });
  }

  const fromSanitized = stripHtml(from.trim()).result;
  const toSanitized = stripHtml(req.body.to.trim()).result;
  const textSanitized = stripHtml(req.body.text.trim()).result;

  const message = {
    from: fromSanitized,
    to: toSanitized,
    text: textSanitized,
    type: req.body.type,
    time: dayjs().tz("America/Sao_Paulo").format("HH:mm:ss"),
  };

  await db.collection("messages").insertOne(message);

  res.status(201).send();
});


// ---------- GET /MESSAGES
app.get("/messages", async (req, res) => {
  const user = req.header("User");

  const limit = parseInt(req.query.limit);

  if (limit < 1 || isNaN(limit)) {
    return res.status(422).send({ message: "Invalid limit value!" });
  }

  try {
    const messages = await db
      .collection("messages")
      .find({
        $or: [
          { to: user },
          { from: user },
          { to: "Todos" },
          { type: "public" },
        ],
      })
      .sort({ $natural: -1 })
      .limit(limit)
      .toArray();

    res.send(messages);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: "Internal Server Error!" });
  }
});


// ---------- POST /STATUS
app.post("/status", async (req, res) => {
  const name = req.header("User");

  if (!name) {
    return res.status(404).send();
  }

  const existingParticipant = await db
    .collection("participants")
    .findOne({ name });

  if (!existingParticipant) {
    return res.status(404).send();
  }

  await db
    .collection("participants")
    .updateOne({ name }, { $set: { lastStatus: Date.now() } });

  res.status(200).send();
});


// Leave the app listening, waiting for requests
const DOOR = 5000; // Available: 3000 to 5999
app.listen(DOOR, () => console.log(`Server running on port ${DOOR}`));
