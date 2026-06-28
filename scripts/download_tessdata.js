import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TESSDATA_DIR = path.join(__dirname, "..", "bin", "tessdata");
const REPO_URL = "https://raw.githubusercontent.com/tesseract-ocr/tessdata_best/main/";

const LANGUAGES = ["eng.traineddata", "deu.traineddata"];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          downloadFile(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function main() {
  console.log("Downloading Tesseract language data...");
  if (!fs.existsSync(TESSDATA_DIR)) {
    fs.mkdirSync(TESSDATA_DIR, { recursive: true });
  }

  for (const lang of LANGUAGES) {
    const dest = path.join(TESSDATA_DIR, lang);
    if (fs.existsSync(dest)) {
      console.log(`${lang} already exists, skipping.`);
      continue;
    }

    const url = `${REPO_URL}${lang}`;
    console.log(`Downloading ${lang}...`);
    try {
      await downloadFile(url, dest);
      console.log(`Successfully downloaded ${lang}`);
    } catch (err) {
      console.error(`Failed to download ${lang}:`, err.message);
      process.exit(1);
    }
  }

  console.log("Tessdata setup complete!");
}

main();
