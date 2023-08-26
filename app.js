const express = require("express");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
intializeDbAndServer();
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectedQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectedQuery);
  if (dbUser === undefined) {
    const createAaccount = `
        INSERT INTO
            user (username, name, password, gender, location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(createAaccount);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectedQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectedQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCorrect) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectedQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectedQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordCorrect === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `
                UPDATE user
                SET password = '${encryptedPassword}'
                WHERE username = '${username}';`;
        await db.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
