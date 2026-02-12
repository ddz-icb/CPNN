import log from "./logger.js";
import express from "express";
import axios from "axios";
import cors from "cors";

// this server is used for API calls to UniProt

const app = express();
app.use(cors());
app.use(express.json());

app.get("/uniprot/:id", async (req, res) => {
  try {
    const uniprotID = req.params.id;
    const response = await axios.get(`https://rest.uniprot.org/uniprotkb/${uniprotID}.json`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error: fetching data from UniProt");
    log.error(error.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});
