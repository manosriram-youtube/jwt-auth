const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
let refreshTokens = [];

app.use(express.json());

function auth(req, res, next) {
    let token = req.headers["authorization"];
    token = token.split(" ")[1]; //Access token

    jwt.verify(token, "access", (err, user) => {
        if (!err) {
            req.user = user;
            next();
        } else {
            return res.status(403).json({ message: "User not authenticated" });
        }
    });
}

app.post("/renewAccessToken", (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: "User not authenticated" });
    }

    jwt.verify(refreshToken, "refresh", (err, user) => {
        if (!err) {
            const accessToken = jwt.sign({ username: user.name }, "access", {
                expiresIn: "20s"
            });
            return res.status(201).json({ accessToken });
        } else {
            return res.status(403).json({ message: "User not authenticated" });
        }
    });
});

app.post("/protected", auth, (req, res) => {
    res.send("Inside protected route");
});

app.post("/login", (req, res) => {
    const user = req.body.user;

    if (!user) {
        return res.status(404).json({ message: "Body empty" });
    }

    let accessToken = jwt.sign(user, "access", { expiresIn: "20s" });
    let refreshToken = jwt.sign(user, "refresh", { expiresIn: "7d" });
    refreshTokens.push(refreshToken);

    return res.status(201).json({
        accessToken,
        refreshToken
    });
});

app.listen(3000);
