// Other
// 1. Configrure eslint, prettier and other tools
// 3. Write an README.md and describe how to configure a service

import { exit } from "process";
import { runGoogleSheetsService } from "./google-sheets";
import { wbServiceRun } from "./wb";
import fs from "fs";

type GoogleSheetsList = {
  sheets: string[];
};

const config = {
  pgHost: process.env.POSTGRES_HOST,
  pgPort: process.env.POSTGRES_PORT,
  pgUser: process.env.POSTGRES_USER,
  pgDbName: process.env.POSTGRES_DB,
  pgPassword: process.env.POSTGRES_PASSWORD,
  pgSsl: process.env.PG_SSL,
  dbUrl: process.env.PG_URL,

  wbApiKey: process.env.WB_API_KEY,

  googleSheetsIds: process.env.GOOGLE_SHEETS_IDS,

  googleSheetssServiceTimeoutSeconds:
    parseInt(process.env.GOOGLE_SHEETS_SERVICE_TIMEOUT_MINUTES) * 60 || 3600,
  googleSheetsSheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || "stocks_coefs",

  wbServiceTimeoutSeconds:
    parseInt(process.env.WB_SERVICE_TIMEOUT_MINUTES) * 60 || 3600,
};

const knex = require("knex")({
  client: "pg",
  connection: {
    connectionString: config.dbUrl,
    host: config.pgHost,
    port: config.pgPort,
    user: config.pgUser,
    database: config.pgDbName,
    password: config.pgPassword,
    ssl: config.pgSsl ? { rejectUnauthorized: false } : false,
  },
});

const wbApiUrl = "https://common-api.wildberries.ru/api/v1/tariffs/pallet";

const spsheetIds = getSheetsIds(
  config.googleSheetsIds || "google-sheets-ids.json",
).sheets;

wbServiceRun(knex, wbApiUrl, config.wbApiKey, config.wbServiceTimeoutSeconds);

runGoogleSheetsService(
  knex,
  spsheetIds,
  config.googleSheetssServiceTimeoutSeconds,
  config.googleSheetsSheetName,
);

/**
 * Get spreadsheets ids from file
 *
 * @function getSheetsIds
 * @param pathToFile A path to json file containing spreadsheet ids
 * @returns An obhect with array of spreadsheet ids
 */
function getSheetsIds(pathToFile: string): GoogleSheetsList {
  try {
    return JSON.parse(fs.readFileSync(pathToFile, "utf-8")) as GoogleSheetsList;
  } catch (e: any) {
    console.log(e);
    exit(-1);
  }
}
