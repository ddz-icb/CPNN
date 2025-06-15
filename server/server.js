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

    let result = "";
    python.stdout.on("data", (chunk) => {
      result += chunk.toString();
    });

    python.stderr.on("data", (err) => {
      log.error("Python Error:", err.toString());
    });

    python.on("close", (code) => {
      if (code !== 0) {
        res.status(500).send("Error: Python script failed");
      } else {
        res.json(JSON.parse(result));
      }
    });

    python.stdin.write(data);
    python.stdin.end();
  } catch (error) {
    res.status(500).send("Error: calculating correlation matrix");
    log.error(error.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});
