const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
let refreshTokens = [];

app.use(express.json());
app.set("view engine", "ejs");
app.use(cors());

// Creates a new accessToken using the given refreshToken;
app.post("/refresh", (req, res, next) => {
    const refreshToken = req.body.token;
    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.json({ message: "Refresh token not found, login again" });
    }

    // If the refresh token is valid, create a new accessToken and return it.
    jwt.verify(refreshToken, "refresh", (err, user) => {
        if (!err) {
            const accessToken = jwt.sign({ username: user.name }, "access", {
                expiresIn: "20s"
            });
            return res.json({ success: true, accessToken });
        } else {
            return res.json({
                success: false,
                message: "Invalid refresh token"
            });
        }
    });
});

// Middleware to authenticate user by verifying his/her jwt-token.
async function auth(req, res, next) {
    let token = req.headers["authorization"];
    token = token.split(" ")[1]; //Access token

    jwt.verify(token, "access", async (err, user) => {
        if (user) {
            req.user = user;
            next();
        } else if (err.message === "jwt expired") {
            return res.json({
                success: false,
                message: "Access token expired"
            });
        } else {
            console.log(err);
            return res
                .status(403)
                .json({ err, message: "User not authenticated" });
        }
    });
}

// Protected route, can only be accessed when user is logged-in
app.post("/protected", auth, (req, res) => {
    return res.json({ message: "Protected content!" });
});

// Route to login user. (In this case, create an token);
app.post("/login", (req, res) => {
    const user = req.body.user;
    console.log(user);

    if (!user) {
        return res.status(404).json({ message: "Body empty" });
    }

    let accessToken = jwt.sign(user, "access", { expiresIn: "2s" });
    let refreshToken = jwt.sign(user, "refresh", { expiresIn: "7d" });
    refreshTokens.push(refreshToken);

    return res.status(201).json({
        accessToken,
        refreshToken
    });
});

app.listen(5000, () => console.log("Running at 5000"));
