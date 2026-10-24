import cors from "cors";
import express from "express";
import { config } from "./config";
import { providerName } from "./lib/nipost";
import { errorHandler, notFound } from "./middleware/error";
import { adminRouter } from "./routes/admin";
import { healthRouter } from "./routes/health";
import { reconfirmRouter } from "./routes/reconfirm";
import { searchRouter } from "./routes/search";
import { verifyRouter } from "./routes/verify";

const app = express();

app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.use(healthRouter);
app.use("/v1", verifyRouter);
app.use("/v1", reconfirmRouter);
app.use("/v1", searchRouter);
app.use("/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

// Bind to localhost by default so the API is reachable only by the Next.js
// frontend on the same host (via nginx). Override with HOST if needed.
const host = process.env.HOST || "127.0.0.1";
app.listen(config.port, host, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[veripost] listening on http://${host}:${config.port}  (NIPOST provider: ${providerName()})`
  );
});
