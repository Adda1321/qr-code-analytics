require("dotenv").config();
const app = require("./app");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`QR tracker listening on port ${port}`);
});
