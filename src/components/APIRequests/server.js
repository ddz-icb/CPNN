// this server is used for API calls to UniProt

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/uniprot/:id", async (req, res) => {
  try {
    const uniprotID = req.params.id;
    const response = await axios.get(
      `https://www.uniprot.org/uniprotkb/${uniprotID}.txt`
    );
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error: fetching data from UniProt");
    console.error(error.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
