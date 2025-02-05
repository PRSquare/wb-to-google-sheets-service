import { google, sheets_v4 } from "googleapis";
import { GoogleAuth } from "google-auth-library";

type GsWarehouseData = {
  pallet_delivery_expr: number;
  pallet_delivery_value_base: number;
  pallet_delivery_value_liter: number;
  pallet_storage_expr: number;
  pallet_storage_value_expr: number;
  warehouse_name: string;
  dt_next_pallet: Date;
  dt_till_max: Date;
  updated_date: Date;
};

type GsValueRange = {
  range: string;
  values: string[][];
};

/**
 * Runs service that uploads data to google spreadsheets
 *
 * @function runGoogleSheetsService
 * @param knex A knex service
 * @param spreadsheetIds An array of spreadsheet ids to upload data to
 * @param timeoutSeconds A delay between uploadings in seconds
 * @param sheetName A name of sheets to upload data to
 * @param keyfile A keyfile with data nesessary for authorization
 */
export function runGoogleSheetsService(
  knex: any,
  spreadsheetIds: string[],
  timeoutSeconds: number,
  sheetName = "stocks_coefs",
  keyfile: string = process.env.GOOGLE_APPLICATION_CREDENTIAL,
) {
  const service = getGoogleSpreadsheetsService(keyfile);

  setInterval(() => {
    getDataFromDatabase(knex).then((data) => {
      const values = data.map((val, i) => {
        const values: string[] = [
          val.pallet_delivery_expr.toString(),
          val.pallet_delivery_value_base.toString(),
          val.pallet_delivery_value_liter.toString(),
          val.pallet_storage_expr.toString(),
          val.pallet_storage_value_expr.toString(),
          val.warehouse_name.toString(),
          val.dt_till_max.toString(),
          val.updated_date.toString(),
        ];
        const range = `${sheetName}!A${i + 1}:H${i + 1}`;
        return {
          range: range,
          values: [values],
        } as GsValueRange;
      });
      spreadsheetIds.forEach((sId) => {
        try {
          batchUpdateValues(service, sId, values);
        } catch (e) {
          console.log(`${Date().toString()}: ${e}`);
        }
      });
    });
  }, timeoutSeconds * 1000);
  console.log(`${Date().toString()}: googleSheets service started`);
}

/**
 * Get authorized google spreadsheet service
 * @param keyfile A path to keyfile
 * @returns an authorized google spreadsheet service
 */
function getGoogleSpreadsheetsService(keyfile: string): sheets_v4.Sheets {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/spreadsheets",
    keyFile: keyfile,
  });

  const service = google.sheets({ version: "v4", auth });

  return service;
}

/**
 * Get warehouse data from database
 *
 * @function getDataFromDatabase
 * @param knex A knex service
 * @returns A Promise to an array of GsWarehouseData
 */
function getDataFromDatabase(knex: any): Promise<GsWarehouseData[]> {
  return new Promise<GsWarehouseData[]>((resolve, reject) => {
    knex("wb_warehouse")
      .join("wb_pallet", "wb_warehouse.pallet_id", "=", "wb_pallet.id")
      .select([
        "wb_warehouse.pallet_delivery_expr",
        "wb_warehouse.pallet_delivery_value_base",
        "wb_warehouse.pallet_delivery_value_liter",
        "wb_warehouse.pallet_storage_expr",
        "wb_warehouse.pallet_storage_value_expr",
        "wb_warehouse.warehouse_name",
        "wb_pallet.dt_next_pallet",
        "wb_pallet.dt_till_max",
        "wb_pallet.updated_date",
      ])
      .then((data: GsWarehouseData[]) => {
        resolve(data);
      })
      .catch((e: Error | string) => {
        reject(e);
      });
  });
}

/**
 * Batch Updates values in a Spreadsheet.
 *
 * @function batchUpdateValues
 * @param service An authorized google sheets service
 * @param spreadsheetId A spreadsheet id
 * @param values An array of objects containing values and ranges
 * @param [valueInputOption="RAW"] An value input option RAW - value is stored as is, USER_ENDERED - parse data (see api docs)
 * @return  spreadsheet information
 */
function batchUpdateValues(
  service: sheets_v4.Sheets,
  spreadsheetId: string,
  values: GsValueRange[],
  valueInputOption: string = "RAW",
) {
  const request: sheets_v4.Params$Resource$Spreadsheets$Values$Batchupdate = {
    spreadsheetId: spreadsheetId,
    requestBody: {
      data: values,
      valueInputOption: valueInputOption,
    },
  };
  try {
    service.spreadsheets.values.batchUpdate(request, (err, response) => {
      if (err) {
        throw err;
      }
      return response.data;
    });
  } catch (err) {
    throw err;
  }
}
