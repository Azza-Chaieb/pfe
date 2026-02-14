// Simple script to test if SMTP configuration works
const nodemailer = require("nodemailer");
console.log("Nodemailer object:", nodemailer);
require("dotenv").config();

async function testEmail() {
  console.log("Testing SMTP configuration...\n");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_FROM:", process.env.SMTP_FROM);
  console.log(
    "SMTP_PASS:",
    process.env.SMTP_PASS ? "***configured***" : "NOT SET",
  );

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Verify connection
    console.log("\n✓ Verifying SMTP connection...");
    await transporter.verify();
    console.log("✓ SMTP connection successful!\n");

    // Send test email
    console.log("✓ Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Send to yourself
      subject: "✅ Test Email from Sunspace Backend",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #667eea;">✅ Email Configuration Works!</h1>
          <p>Your SMTP configuration is correctly set up.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log("✓ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("\n🎉 All tests passed! Check your inbox.");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.code) console.error("Error code:", error.code);
  }
}

testEmail();
