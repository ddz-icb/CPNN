import log from "./logger.js";
import express from "express";
import axios from "axios";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

// this server is used for API calls to UniProt and computation of correlation matrices

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/uniprot/:id", async (req, res) => {
  try {
    const uniprotID = req.params.id;
    const response = await axios.get(`https://www.uniprot.org/uniprotkb/${uniprotID}.txt`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error: fetching data from UniProt");
    log.error(error.message);
  }
});

app.post("/correlationMatrix", upload.single("file"), (req, res) => {
  try {
    const data = req.file.buffer.toString("utf-8");
    const method = req.body.method;

    const pythonScriptPath = path.resolve(__dirname, "corr_matrix.py");
    const pythonEnvPath = path.resolve(__dirname, "cpnn/bin/python");
    const python = spawn(pythonEnvPath, [pythonScriptPath, method]);

    res.setHeader("Content-Type", "application/json");

    python.stdout.pipe(res);

    python.stderr.on("data", (err) => {
      log.error("Python Error:", err.toString());
    });

    python.on("close", (code) => {
      if (code !== 0) {
        log.error(`Python script exited with code ${code}`);
      } else {
        log.info("Python script finished successfully.");
      }
    });

    python.stdin.write(data);
    python.stdin.end();
  } catch (error) {
    res.status(500).send("Error: Could not start correlation matrix calculation");
    log.error(error.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});
