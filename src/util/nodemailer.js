import nodemailer from "nodemailer";

export default async (email, id, key) => {
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
    from: "noreply@cse356.compas.cs.stonybrook.edu",
    to: email,
    subject: "Verify Email",
    text: `http://masonmafanclub.cse356.compas.cs.stonybrook.edu/users/verify?id=${id}&key=${key}`,
  });
};
