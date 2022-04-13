import nodemailer from "nodemailer";

export default async (email, key) => {
  let transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 587,
    secure: false,
    auth: {
      user: "user",
      pass: "password",
    },
  });
  await transporter.sendMail({
    from: "cse356_noreply",
    to: email,
    subject: "Verify Email",
    text: key,
  });
};
