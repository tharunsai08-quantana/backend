const express = require('express');
const cors = require('cors');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../Models/Users'); 
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
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
};



























module.exports = { signUp, verifyEmail,Login };


