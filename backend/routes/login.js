// Delegate all login, /me, and logout requests to the hardened auth route
const authRouter = require("./auth");

module.exports = authRouter;