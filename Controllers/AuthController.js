const express = require('express');
const cors = require('cors');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../Models/Users');
const Event = require('../Models/Event');
const appliedUser = require('../Models/appliedUser');
const attendedUser = require('../Models/attendedUser');
const userActivity = require('../Models/userActivity');
const { v4: uuidv4 } = require('uuid');
const qrcode = require("qrcode");
const dotenv = require('dotenv');
const useragent = require('useragent');
const Users = require('../Models/Users');
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
      subject: "Eventoo -Verify Email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p style="font-size: 16px; color: #555;">Hi ${newUser.name || 'User'},</p>
            <p style="font-size: 16px; color: #555;">Thank you for signing up. Please click the button below to verify your email address.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:8000/auth/verify_email?token=${token}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email
              </a>
            </div>
            <p style="font-size: 14px; color: #999;">If the button doesn't work, copy and paste the following URL into your browser:</p>
            <p style="font-size: 14px; color: #555;"><a href="http://localhost:8000/auth/verify_email?token=${token}" style="color: #007bff;">http://localhost:8000/auth/verify_email?token=${token}</a></p>
          </div>
        </div>
      `
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

    const fullUserAgent = req.headers['user-agent'];
    const agent = useragent.parse(fullUserAgent);

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;


    const activity = new userActivity({
      username: user.name,
      email: user.email,
      ipAddress: ip,
      deviceInfo: `${agent.toString()} | Full UA: ${fullUserAgent}`
    });
    await activity.save();

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
    user.resetPasswordExpires = Date.now() + 3600000;
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
      subject: "Reset Your Password – OneStay",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 40px auto; padding: 30px; background: #ffffff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1a1a1a; text-align: center;">Reset Your Password</h2>
          <p style="font-size: 15px; color: #4a4a4a; line-height: 1.6; text-align: center;">
            We received a request to reset your password for your OneStay account.
            Click the button below to securely create a new one.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="http://localhost:8000/auth/reset_password?token=${token}" 
               style="padding: 14px 30px; background-color: #007BFF; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #7a7a7a; line-height: 1.5;">
            If you didn't request a password reset, you can safely ignore this email. Your current password will remain unchanged.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999999; text-align: center;">
            © 2025 OneStay. All rights reserved.
          </p>
        </div>
      `
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
      resetPasswordExpires: { $gt: Date.now() },
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


const createEvent = async (req, res) => {
  const lastEventId = (await Event.findOne().sort({ _id: -1 }))?.eventId;
  const newEventId = lastEventId ? parseInt(lastEventId) + 1 : 1;

  const { organizer, title, speaker, image, hostedBy, category, description, eventDate, location } = req.body;

  if (!organizer || !title || !speaker || !image || !hostedBy || !category || !description || !eventDate || !location) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // if (Event.findOne({ title, eventDate })) {
  //   return res.status(400).json({ "messgae": "Event with the same title and eventDate already exists" });
  // }
  const event = new Event({
    eventId: newEventId.toString(),
    organizer,
    title,
    speaker,
    image,
    hostedBy,
    category,
    description,
    eventDate,
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

const updateEvent = async (req, res) => {
  const {
    eventId,
    organizer,
    title,
    speaker,
    image,
    hostedBy,
    category,
    description,
    eventDate,
    location,
  } = req.body;

  const requiredFields = [
    "eventId",
    "organizer",
    "title",
    "speaker",
    "image",
    "hostedBy",
    "category",
    "description",
    "eventDate",
    "location",
  ];

  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Missing required fields",
      missing: missingFields,
    });
  }

  try {
    const event = await Event.findOneAndUpdate(
      { eventId },
      {
        organizer,
        title,
        speaker,
        image,
        hostedBy,
        category,
        description,
        eventDate,
        location,
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const appliedUsers = await appliedUser.find(
      { status: "applied", eventId: event.eventId },
      { email: 1, _id: 0 }
    );

    const emails = appliedUsers.map(user => user.email);

    if (emails.length > 0) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        bcc: emails,
        subject: `Update on event: ${title}`,
        text: `Hello,\n\nThe event "${title}" you applied for has been updated.\nPlease check the details.\n\nBest regards,\nEvent Team`,
      });
    }

    return res.status(200).json({ message: "Event updated successfully", event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error while updating event" });
  }
};

const showEvents = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const now = new Date();

    if (role === "admin") {
      const events = await Event.find({ eventDate: { $gte: now } }).sort({ eventDate: 1 });
      if (!events.length) {
        return res.status(200).json({ message: "No events found" });
      }
      return res.status(200).json(events);
    }

    const applied = await appliedUser.find({ email }, { eventId: 1, _id: 0 });
    const appliedEventIds = applied.map((item) => item.eventId);

    const events = await Event.find({
      eventDate: { $gte: now },
      eventId: { $nin: appliedEventIds },
    }).sort({ eventDate: 1 });

    if (!events.length) {
      return res.status(200).json({ message: "No events found" });
    }

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching events" });
  }
};

module.exports = showEvents;


const applyEvent = async (req, res) => {
  const { eventId, title, eventDate, name, email } = req.body;
  if (!email || !eventId || !name || !title) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const data = new appliedUser({
      eventId,
      name,
      email,
      title,
      eventDate,
      appliedAt: new Date(),
      status: 'Applied',
    });

    await data.save();

    return res.status(201).json({ message: "Successfully applied to the event" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }

};

const deleteEvent = async (req, res) => {
  try {
    const { email, eventId } = req.body;

    if (!email || !eventId) {
      return res.status(400).json({ message: "Email and Event ID are required" });
    }

    const result = await appliedUser.deleteOne({ email, eventId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No matching event found to delete" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const appliedEvent = async (req, res) => {
  const { email, role } = req.body;

  try {
    let data;

    if (role === "admin") {
      data = await appliedUser.find({ status: "Applied" });
    }
     else if (role === "user") {
      if (!email) {
        return res.status(400).json({ message: "Email is required for user role" });
      }
      data = await appliedUser.find({ email });
    } 
    else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({ message: "No applied events found" });
    }

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};


const showApprovedEvents = async (req, res) => {
  try {
    const events = await appliedUser.find({ status: "Approved" });
    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No approved events found" });
    }
    return res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching approved events:", error);
    return res.status(500).json({ message: "Server error while fetching approved events" });
  }
}


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendApprovalEmail(name, email, keyId, qrCode, title, eventDate) {
  try {
    const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
    const qrImageBuffer = Buffer.from(base64Data, "base64");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Approval for Event ${title}`,
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <div style="padding: 30px;">
            <h2 style="color: #333;">Event Approval Confirmation</h2>
            <p style="font-size: 16px; color: #555;">
              Hello <strong>${name}</strong>,
            </p>
            <p style="font-size: 16px; color: #555;">
              Your request has been <strong style="color: green;">approved</strong> for the event <strong>${title}</strong>.
            </p>
                        <p style="font-size: 16px; color: #555;">
  <strong>Event Date:</strong> ${new Date(eventDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
</p>
            <p style="font-size: 16px; color: #555;">
              <strong>Key ID:</strong> <code style="background: #f4f4f4; padding: 4px 8px; border-radius: 4px;">${keyId}</code>
            </p>
            <div style="margin: 20px 0;">
              <img src="cid:qrimage" alt="QR Code" style="width: 180px; height: auto; border: 1px solid #ddd; padding: 4px; border-radius: 4px;" />
            </div>
            <p style="font-size: 14px; color: #888;">
              Please present this QR code at the entry gate for verification.
            </p>


            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </div>
    `,

      attachments: [
        {
          filename: "qrcode.png",
          content: qrImageBuffer,
          cid: "qrimage",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Approval email sent to", email);
  } catch (err) {
    console.error("Email error:", err);
  }
}

const userEventStatus = async (req, res) => {
  const { eventId, name, email, status, title,eventDate } = req.body;
console.log("Received data:", { eventId, name, email, status, title,eventDate });
  try {
    const numericEventId = parseInt(eventId);
    console.log("Parsed eventId:", numericEventId);
    const eventDateObj = new Date(eventDate);
    if (isNaN(eventDateObj.getTime())) {
      return res.status(400).json({ message: "Invalid eventDate format", eventDate });
    }



    const data = await appliedUser.findOne({
      eventId: numericEventId,
      name,
      email,
      title,
      eventDate
    });

    if (!data) {
      return res.status(404).json({ message: "No application found for this event" });
    }

    if (status) {
      data.status = status;
      data.statusAt = new Date();

      if (status === "Approved") {
        const keyId = uuidv4();
        const qrCodeImage = await qrcode.toDataURL(keyId);
        data.qrCode = qrCodeImage;
        data.keyId = keyId;
        await sendApprovalEmail(name, email, keyId, qrCodeImage, title, eventDate);
      }

      if (status === "Rejected") {
        data.qrCode = null;
        data.keyId = null;
      }

      await data.save();
    }

    return res.status(200).json({ message: "Status updated", data });
  } catch (err) {
    console.error("Error updating user event status:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};






const idVerification = async (req, res) => {
  const { key } = req.body;

  try {
    const data = await appliedUser.findOne({ keyId: key });
    if (!data) {
      return res.status(404).json({ message: "No data found for this key" });
    }

    if (new Date(data.eventDate) < new Date()) {
      return res.status(400).json({ message: "Event has already passed" });
    }

    const alreadyVerified = await attendedUser.findOne({
      email: data.email,
      eventId: data.eventId,
    });

    if (alreadyVerified) {
      return res.status(400).json({ message: "User verification already done!" });
    }

    const attendedUserData = new attendedUser({
      eventId: data.eventId,
      title: data.title,
      name: data.name,
      email: data.email,
      attened: true, 
      verificationTime: new Date(),
    });

    await attendedUserData.save();

    return res.status(200).json({
      message: "Attendance verified successfully",
      data: attendedUserData,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};





const attendedUsers = async (req, res) => {
try {
  const users = await attendedUser.find();

  if (!users || users.length === 0) {
    return res.status(404).json({ message: "No attended users found" });
  }

  return res.status(200).json({ data: users });
} catch (err) {
  console.error("Error fetching users:", err);
  return res.status(500).json({ message: "Server error while fetching users" });
}
};

const eventDetailsforGatekeeper = async (req, res) => {
  try {
    const date = new Date();

    const upcomingEvents = await appliedUser
      .find({ eventDate: { $gte: date } })
      .sort({ eventDate: 1 })
      .limit(3);

    const result = [];

    for (let event of upcomingEvents) {
      const titleRegex = new RegExp(`^${event.title}$`, 'i'); // Case-insensitive match

      const approvedCount = await appliedUser.countDocuments({
        title: { $regex: titleRegex },
        status: "Approved",
      });

      const attendedCount = await attendedUser.countDocuments({
        title: { $regex: titleRegex },
        attened: true,
      });

      result.push({
        title: event.title,
        eventDate: event.eventDate,
        approvedCount,
        attendedCount,
      });
    }

    return res.status(200).json({
      nextEvents: result,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error while fetching event details" });
  }
};
const movingCount = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totaluser = await User.countDocuments();

    return res.status(200).json({ totalEvents, totaluser });
  } catch (err) {
    console.error("Error fetching count:", err);
    return res.status(500).json({ message: "Server error while fetching count" });
  }
};




module.exports = {
 eventDetailsforGatekeeper,movingCount, attendedUsers,signUp,deleteEvent, verifyEmail, Login, forgotPassword, resetPassword, createEvent, showEvents, updateEvent, applyEvent, userEventStatus,showApprovedEvents, idVerification, appliedEvent
};


