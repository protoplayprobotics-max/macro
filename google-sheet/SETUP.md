# Connect the contact form to a Google Sheet

Every form submission on the website is added as a new row in your Google Sheet.

## 1. Create the sheet
1. Go to https://sheets.google.com and create a **Blank spreadsheet**.
2. Name it, for example `Website Enquiries`.

## 2. Add the script
1. In the sheet, open **Extensions → Apps Script**.
2. Delete everything in `Code.gs` and paste in the contents of [`Code.gs`](Code.gs) from this folder.
3. (Optional) To get an email for every enquiry, put your address in `NOTIFY_EMAIL`, e.g. `var NOTIFY_EMAIL = "you@gmail.com";`
4. Click **Save** (disk icon).

## 3. Deploy it as a web app
1. Click **Deploy → New deployment**.
2. Click the gear icon next to *Select type* and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy**, then **Authorize access** and allow it with your Google account.
   (If Google shows "Google hasn't verified this app", click **Advanced → Go to … (unsafe)**: it is your own script.)
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy..../exec`.

## 4. Put the URL in the website
Open `js/main.js` and paste the URL into:

```js
var SHEET_URL = "https://script.google.com/macros/s/AKfy..../exec";
```

Then commit and push. Submissions will appear in the **Enquiries** tab of your sheet.

## Changing the script later
After editing `Code.gs`, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**.
This keeps the same URL, so the website does not need to change.
