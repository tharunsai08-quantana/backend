const express = require('express');
const cors = require('cors');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../Models/Users');
const Event = require('../Models/Event');
const dotenv = require('dotenv');
dotenv.config();
const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationToken: token,
    });
    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: newUser.email,
      subject: "Verify your email",
      html: `<p>Click <a href="http://localhost:8000/auth/verify_email?token=${token}">here</a> to verify your email.</p>`
    });

    res.status(201).json({ message: "User created successfully. Verification email sent." });
  
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token?.trim();

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.send("Email verified successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during verification" });
  }
};


const Login = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and Password are required" });
    }

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
};



const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {    
      return res.status(400).json({ message: "User not found" });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click <a href="http://localhost:8000/auth/reset_password?token=${token}">here</a> to reset your password.</p>`
    });
    res.status(200).json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during password reset" });
  }
}


const resetPassword = async (req, res) => {
  try {
    

    const { token, newPassword } = req.body;


    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const user = await User.findOne({
      verificationToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // token still valid
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.verificationToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during password reset" });
  }
};


const eventDetails = async (req, res) => {
  const lastEventId = (await Event.findOne().sort({ _id: -1 }))?.eventId;
const newEventId = lastEventId ? parseInt(lastEventId) + 1 : 1;

  const { organizer, title, speaker, image, hostedBy, category, description, date, location } = req.body;

  if (!organizer || !title || !speaker || !image || !hostedBy || !category || !description || !date || !location) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const event = new Event({
    eventId: newEventId.toString(),
    organizer,
    title,
    speaker,
    image,
    hostedBy,
    category,
    description,
    date,
    location,
    createdBy: organizer
  });
  try {
    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating event" });
  }
}




















module.exports = { signUp, verifyEmail,Login,eventDetails,forgotPassword,resetPassword };


