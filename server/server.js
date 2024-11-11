// this server is used for API calls to UniProt

import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/uniprot/:id", async (req, res) => {
  try {
    const uniprotID = req.params.id;
    const response = await axios.get(`https://www.uniprot.org/uniprotkb/${uniprotID}.txt`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error: fetching data from UniProt");
    console.error(error.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});
