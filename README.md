# wb-to-google-sheets-service

This is small service that gets data from wildberies and uploads it to google sheets.

# Setting up

To configure the service follow this steps:

### Set up `.env` file

Create `.env` file in project directory. There is `.env.default` file which provides a basic setup for service, **but you still need to add your api keys** for it to work.

**Environment variables:**

`POSTGRES_HOST` - A postgres host. Also used to configure postgres container.
`POSTGRES_PORT` - A postgres port. Also used to configure postgres container.
`POSTGRES_USER` - A postgres user. Also used to configure postgres container.
`POSTGRES_DB` - A database name.Also used to configure postgres container.
`POSTGRES_PASSWORD` - A postgres user password. Also used to configure postgres container.
`GOOGLE_APPLICATION_CREDENTIALS` - a path to google sheet keys (see [Set up Google Sheets](#set-up-google-sheets))
`WB_API_KEY` - An wildberies api key
`GOOGLE_SHEETS_SERVICE_TIMEOUT_MINUTES` - Timeout in minutes for service that uploads data to google sheets to run.
`GOOGLE_SHEETS_SHEET_NAME` - A name of sheet to upload data to.
`WB_SERVICE_TIMEOUT_MINUTES` - Timeout in minutes for service that gets data from wildberies to run.

### Set up Google Sheets

1.  [Enable Google Sheets API](https://console.cloud.google.com/flows/enableapi?apiid=sheets.googleapis.com) in your google cloud account.
2.  [Add a service account](https://console.cloud.google.com/iam-admin/serviceaccounts) to your project.
3.  After creating service account download it's private key and save it to project .directory You need to specify a path to your `jwt.keys.json` file in `GOOGLE_APPLICATION_CREDENTIALS` environment variable. You can do it in `.env` file.

### Create spreadsheets

- Create spreadsheets. **Make sure that spreadsheets have a sheet that will be used to upload data to** (default 'stocks_coefs'. You can modify sheet name in .env file).
- Grant editor acces to your Google Cloud service account on each spreadsheet.

### Create json file with spreadsheet ids

Copy a spreadsheet ids into json file. You can get a spreadsheet id from link:
https://docs.google.com/spreadsheets/d/**spreadsheet-id**/edit?gid=0#gid=0

And paste them into json file in your project directory. The format is:

```json
{
  "sheets": [
    "your-sheet-id-1",
    "your-sheet-id-2",
    ...
    ]
}
```

specify path to this json file in `.env` file.

### Run docker-compose

```sh
docker-compose build
docker-compose up
```
