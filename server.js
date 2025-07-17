const cors=require('cors');
const mongoose = require('mongoose');
const AuthRouter = require('./Routes/AuthRouter');
const app = express();
const PORT = 3000;

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
module.exports = app; 