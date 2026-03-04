const nodemailer = require("nodemailer");
require("dotenv").config();

async function testSMTP() {
  console.log("Testing SMTP with:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // For 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP Connection verified successfully!");

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "azachaieb@gmail.com",
      subject: "Test Sunspace SMTP",
      text: "Ceci est un test de connexion SMTP direct.",
    });
    console.log("Test email sent!");
  } catch (err) {
    console.error("SMTP Test failed:", err);
  } finally {
    process.exit(0);
  }
}

testSMTP();
