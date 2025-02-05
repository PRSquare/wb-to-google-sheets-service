import fetch from "node-fetch";

type WarehouseData = {
  palletDeliveryExpr: number;
  palletDeliveryValueBase: number;
  palletDeliveryValueLiter: number;
  palletStorageExpr: number;
  palletStorageValueExpr: number;
  warehouseName: string;
};

type PalletData = {
  dtNextPallet: string;
  dtTillMax: string;
  warehouseList: WarehouseData[];
};

type PalletDataRaw = {
  dtNextPallet: string;
  dtTillMax: string;
  warehouseList: any[];
};

type ResponseData = {
  response: {
    data: PalletDataRaw;
  };
};

/**
 * Runs a service that gets a pallet data from wildberies
 *
 * @function wbServiceRun
 * @param knex A knex service
 * @param wbApiUrl A url to wildberies API
 * @param wbApiKey An wildberies api key
 * @param timeoutSeconds A request's timout in seconds
 */
export function wbServiceRun(
  knex: any,
  wbApiUrl: string,
  wbApiKey: string,
  timeoutSeconds: number,
) {
  setInterval(() => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0");
    const formatDate = `${date.getFullYear()}-${month}-${day}`;
    fetchDataFromWb(formatDate, wbApiUrl, wbApiKey)
      .then((data) => {
        wbDataToDatabase(knex, data, formatDate)
          .then(() => {
            console.log(`${Date().toString()}: data puted to database`);
          })
          .catch((e: string | Error) => {
            console.log(`${Date().toString()}: ${e}`);
          });
      })
      .catch((e) => {
        console.log(`${Date().toString()}: ${e}`);
      });
  }, timeoutSeconds * 1000);

  console.log(`${Date().toString()}: wbService started`);
}

/**
 * Fetches data from wildberies
 *
 * @function fetchDataFromWb
 * @param date A date to get data for
 * @param wbApiUrl An api url
 * @param wbApiKey An api key
 * @returns A Promise to palletData
 */
function fetchDataFromWb(
  date: string,
  wbApiUrl: string,
  wbApiKey: string,
): Promise<PalletData> {
  return new Promise<PalletData>((resolve, reject) => {
    fetch(`${wbApiUrl}?date=${date}`, {
      method: "GET",
      headers: {
        Authorization: wbApiKey,
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data: ResponseData) => {
        const warehouseData = parseWarehouseData(data.response.data);
        resolve(warehouseData);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

/**
 * Puts pallet data to database
 *
 * @function wbDataToDatabase
 * @param knex A knex service
 * @param data A pallet data
 * @param updateDate A current date formated YYYY-MM-DD
 * @returns A Promise which resolves when work is done
 */
function wbDataToDatabase(
  knex: any,
  data: PalletData,
  updateDate: string,
): Promise<boolean> {
  const palletTableName = "wb_pallet";
  const warehouseTableName = "wb_warehouse";
  return new Promise<boolean>((resolve, reject) => {
    knex(palletTableName)
      .insert(
        {
          dt_next_pallet: data.dtNextPallet !== "" ? data.dtNextPallet : null,
          dt_till_max: data.dtTillMax,
          updated_date: updateDate,
        },
        ["id"],
      )
      .onConflict("updated_date")
      .merge(["dt_next_pallet", "dt_till_max"])
      .then((ids: any[]) => {
        if (!ids || ids.length == 0) {
          reject(Error("Can't get pallet id"));
        }

        const palletId = ids[0];
        data.warehouseList.forEach((w) => {
          knex(warehouseTableName)
            .insert({
              pallet_id: palletId.id,
              pallet_delivery_expr: w.palletDeliveryExpr,
              pallet_delivery_value_base: w.palletDeliveryValueBase,
              pallet_delivery_value_liter: w.palletDeliveryValueLiter,
              pallet_storage_expr: w.palletStorageExpr,
              pallet_storage_value_expr: w.palletStorageValueExpr,
              warehouse_name: w.warehouseName,
            })
            .onConflict(["pallet_id", "warehouse_name"])
            .merge([
              "pallet_delivery_expr",
              "pallet_delivery_value_base",
              "pallet_delivery_value_liter",
              "pallet_storage_expr",
              "pallet_storage_value_expr",
            ])
            .then(resolve(true))
            .catch((e: Error | string) => {
              reject(e);
            });
        });
      });
  });
}

/**
 * Converts raw data of wildberies api response to palletData
 *
 * @function parseWarehouseData
 * @param pd An wildberies api response
 * @returns A pallet data
 */
function parseWarehouseData(pd: PalletDataRaw): PalletData {
  const parsed: PalletData = {
    dtNextPallet: pd.dtNextPallet,
    dtTillMax: pd.dtTillMax,
    warehouseList: pd.warehouseList.map(
      (w) =>
        ({
          palletDeliveryExpr: parseInt(w.palletDeliveryExpr),
          palletDeliveryValueBase: parseFloat(
            w.palletDeliveryValueBase.replace(",", "."),
          ),
          palletDeliveryValueLiter: parseFloat(
            w.palletDeliveryValueLiter.replace(",", "."),
          ),
          palletStorageExpr: parseFloat(w.palletDeliveryExpr.replace(",", ".")),
          palletStorageValueExpr: parseInt(w.palletDeliveryExpr),
          warehouseName: w.warehouseName,
        }) as WarehouseData,
    ),
  };

  return parsed;
}
