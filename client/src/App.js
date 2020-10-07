import React from "react";
import "./App.css";
import axios from "axios";
import Cookies from "js-cookie";

function App() {
    const [user, setUser] = React.useState({});
    const [loginStatus, setLoginStatus] = React.useState(false);
    const [err, setErr] = React.useState("");
    const [message, setMessage] = React.useState("");


    // Creates a new accessToken using the refreshToken. (Return a promise of new accessToken)
    const refresh = async (refreshToken) => {
        console.log("Refreshing token");

        return new Promise((resolve, reject) => {
            // Hit /refresh api passing the refreshToken as body.
            axios.post("http://localhost:5000/refresh", {"token": refreshToken}).then(data => {
                // If not a success, set error message and return.
                if (data.data.success === false) {
                    setErr(data.data.message);
                    setMessage("");
                    resolve(false);
                }
                // If success, grab the newly created accessToken from response, update the accessToken cookie and return it.
                else {
                    const { accessToken } = data.data;
                    Cookies.set("access", accessToken);
                    resolve(accessToken);
                }
            });
        });
    };

    // Hits the protected route and sets the message.
    const requestLogin = async (accessToken, refreshToken) => {
        return new Promise((resolve, reject) => {
            // Hit the /protected route with empty body ({}) and an authorization header with accessToken in it.
            axios.post("http://localhost:5000/protected", {}, { headers: { authorization: `Bearer ${accessToken}` } }).then(async data => {
                // If not a success,
                if (data.data.success === false) {
                    // Refresh token expired, login again.
                    if (data.data.message === "User not authenticated") {
                        setErr("Please login again");

                        // Access token expired, call refresh() to get new accessToken and recursively call this requestLogin() function again.
                    } else if (data.data.message === "Access token expired") {
                        const accessToken = await refresh(refreshToken);
                        return await requestLogin(accessToken, refreshToken);
                    }
                    setErr(data.data.message);
                    setMessage("");
                    resolve(false);
                }
                else {
                    // If a success, just handle response. (In this case, we're setting a message)
                    const { message } = data.data;
                    setMessage(message);
                    resolve(true);
                }
            });
        });
    };

    // Submits login form and sets access and refresh cookies.
    const handleSubmit = e => {
        e.preventDefault();
        axios.post("http://localhost:5000/login", { user }).then(data => {
            const { accessToken, refreshToken } = data.data;
            Cookies.set("access", accessToken);
            Cookies.set("refresh", refreshToken);
        });
    };

    const handleChange = e => {
        setUser({...user, [e.target.name]: e.target.value });
    };

    // Checks if the accessToken is valid or not, if not; creates new accessToken using the refreshToken. (returns accessToken)
    const hasAccess = async (accessToken, refreshToken) => {
        console.log(accessToken, refreshToken);

        // if refreshToken has expired, user has to login again.
        if (!refreshToken) {
            return null;
        }

        // If accessToken has expired, create new accessToken using the refreshToken.
        if (accessToken == undefined) {
            // Call refresh function passing refreshToken as param.
            accessToken = await refresh(refreshToken);
            return accessToken;
        }

        // If accessToken is valid, just return it.
        return accessToken;
    };

    const protect = async () => {
        // Get access and refresh tokens from cookies.
        let accessToken = Cookies.get("access");
        const refreshToken = Cookies.get("refresh");

        // Check if the accessToken is valid, else create new accessToken using the refreshToken.
        accessToken = await hasAccess(accessToken, refreshToken);

        if (!accessToken) {
            setMessage("Login again");
        } else {
            await requestLogin(accessToken, refreshToken);
        }
    };

    return (
        <div className="App">
            <form onSubmit={handleSubmit} onChange={handleChange}>
                <input name="email" type="email" placeholder="Email Address" />
                <br />
                <br />
                <input name="password" type="password" placeholder="Passowrd" />
                <br />
                <br />
                <input type="submit" value="login" />
                <br />
                <br />
            </form>

            {err}

            <button onClick={protect}>Access Protected Content</button>
            <br />
            {message}
        </div>
    );
}

export default App;
