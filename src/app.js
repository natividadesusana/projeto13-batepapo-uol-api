import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";


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


// Endpoints
app.post("/participants", async (req, res) => { // req (request information) & res (reply information we will send)
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
      name: req.body.name,
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


app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants || []);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


// Leave the app listening, waiting for requests
const DOOR = 5000; // Available: 3000 to 5999
app.listen(DOOR, () => console.log(`Server running on port ${DOOR}`));
