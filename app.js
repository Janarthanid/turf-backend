const express = require("express");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;
const mongourl = "mongodb+srv://janarthani39:Jana14@cluster0.lncan.mongodb.net/TurfManager";

mongoose
  .connect(mongourl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database Connected Successfully");
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  })
  .catch((err) => console.error("Database connection failed:", err));


const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const turfSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
});

const Turf = mongoose.model("Turf", turfSchema);

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  turfName: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Booking = mongoose.model("Booking", bookingSchema);

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret_key");
    req.userId = decoded.userId; 
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};


app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: "User registration failed" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret_key", { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});


app.post("/turfs",async (req, res) => {
  const { name, location, price } = req.body;
  try {
    const turf = new Turf({ name, location, price });
    await turf.save();
    res.status(201).json({ message: "Turf created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error creating turf" });
  }
});

app.get("/turfs", async (req, res) => {
  try {
    const turfs = await Turf.find();
    res.status(200).json(turfs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching turfs" });
  }
});


app.post("/bookings", async (req, res) => {
  const { turfName, location, price, date, time } = req.body;
  try {
    const booking = new Booking({ id: uuidv4(), turfName, location, price, date, time, userId: req.userId });
    await booking.save();
    res.status(201).json({ message: "Booking created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error creating booking" });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Error fetching bookings" });
  }
});

app.put("/bookings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedBooking = await Booking.findOneAndUpdate(
      { id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!updatedBooking) return res.status(404).json({ error: "Booking not found" });
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: "Error updating booking" });
  }
});


app.delete("/bookings/:id",async (req, res) => {
  const { id } = req.params;
  try {
    const deletedBooking = await Booking.findOneAndDelete({ id, userId: req.userId });
    if (!deletedBooking) return res.status(404).json({ error: "Booking not found" });
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting booking" });
  }
});


app.put("/turfs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedTurf = await Turf.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedTurf) return res.status(404).json({ error: "Turf not found" });
    res.status(200).json(updatedTurf);
  } catch (error) {
    res.status(500).json({ error: "Error updating turf" });
  }
});


app.delete("/turfs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTurf = await Turf.findByIdAndDelete(id);
    if (!deletedTurf) return res.status(404).json({ error: "Turf not found" });
    res.status(200).json({ message: "Turf deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting turf" });
  }
});

