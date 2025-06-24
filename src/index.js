import connectdb from "./db/index.js";
import { app } from "./app.js";

connectdb()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ Error starting the server:", err);
  });


