# FFA Reports

Standalone, no-database tool that:

1. Reads a CSV of member portfolio rows from `input/report.csv`
2. Renders a single HTML report at `output/report.html`
3. Optionally emails each member their personal summary (or a single
   consolidated report to an operator)

No backend, no DB, no Schwab dependency.

## Setup

```powershell
cd ffa-reports
npm install
copy .env.example .env   # then edit with your Gmail + App Password
```

## Usage

Drop your CSV at `input/report.csv` (or use `input/sample.csv` to test).

```powershell
# Build HTML only (no email)
node index.js --no-send

# Build + email every member
node index.js

# Build + email a single consolidated report to OPERATOR_EMAIL only
node index.js --operator
```

## Expected CSV columns

The script is forgiving — it accepts a number of common column names:

| What we want      | Accepted CSV column names                                   |
| ----------------- | ----------------------------------------------------------- |
| Member name       | `member_name`, `Member_Name`, `name`, `Name`                |
| Email             | `email`, `Email`                                            |
| Portfolio value   | `portfolio_value`, `Portfolio_Value`, `value`, `Value`      |
| Total units       | `total_units`, `Total_Units`, `units`, `Units`              |
| % Ownership       | `ownership_pct`, `Ownership_Pct`, `pct`, `percent`          |

Extra columns are ignored. Rows without an email will still appear in the
HTML report but will be skipped when sending personalized emails.

## Gmail setup

1. Turn on 2-Step Verification on your Google account.
2. Create an App Password at <https://myaccount.google.com/apppasswords>.
3. Put it in `.env` as `PASSWORD=...`.
