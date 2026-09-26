# CoWiTa Form Database & Email Setup

This guide connects every website form to a **Google Sheet** (the database)
and turns on **automatic confirmation emails**. It takes about 5–10 minutes,
needs no server, and is free.

## How it works

```
Website form (any of the 7 forms)
        │  POST (JSON)
        ▼
Google Apps Script web app  (apps-script/Code.gs)
        │
        ├── saves the submission as a new row in a Google Sheet tab
        │     Talent / Learn / Mentor / Collaborate / Partner / Contact / Support
        │
        ├── emails the applicant: "We have received your application..."
        └── emails your team a notification with the details
```

The visitor is then redirected to `/get-involved/thank-you.html`,
which shows the confirmation message and an **Explore CoWiTa** button.

---

## Step 1 — Create the spreadsheet (the database)

1. Go to [sheets.new](https://sheets.new) while signed in to your Google account.
2. Name it **CoWiTa Form Submissions**.

## Step 2 — Add the backend script

1. In the sheet: **Extensions → Apps Script**.
2. Delete the default code and paste the entire contents of
   `apps-script/Code.gs` from this repository.
3. Near the top of the file, set the team inbox:

   ```js
   var TEAM_EMAIL = 'youremail@example.com';
   ```

   (Also update `SITE_URL` if you have your final domain.)

4. Press **Ctrl/Cmd + S** to save.

## Step 3 — Run setup once

1. In the Apps Script toolbar, choose the function **setUp** and click **Run**.
2. Google will ask for authorisation — click **Review permissions**,
   choose your account, **Advanced → Go to (unsafe)** if shown, then **Allow**.
   This is normal: the script is yours, running in your own account.
3. You should receive a test email at `TEAM_EMAIL`, and the sheet now has
   the tabs: Talent, Learn, Mentor, Collaborate, Partner, Contact, Support, Test.

> Gmail sending limits: consumer accounts may send ~100 emails/day.
> Each submission sends one email to the applicant and one to your team.

## Step 4 — Deploy the web app

1. In Apps Script: **Deploy → New deployment**.
2. Click the gear icon → choose **Web app**.
3. Set:
   - Description: `CoWiTa form backend`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).

## Step 5 — Connect the website

1. Open `js/config.js` in this project.
2. Paste your URL:

   ```js
   window.COWITA_CONFIG = {
     FORM_ENDPOINT: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   };
   ```

3. Deploy/publish the site as usual. Done!

---

## Testing

1. Open the live site and submit any form (e.g. *I Have Talent*).
2. You should see:
   - the **"We have received your application"** confirmation page,
   - a confirmation email in the applicant's inbox,
   - a notification email in the team inbox,
   - a new row in the matching sheet tab.

## Maintenance notes

- **New form fields need zero work**: the script adds a new column the first
  time a submission includes an unknown field.
- **Editing the script later**: after changing code, use
  **Deploy → Manage deployments → Edit → Version: New version** so the
  website picks up the changes (the URL stays the same).
- **Spam**: each form contains a hidden "honeypot" field that bots fill in;
  those submissions are discarded silently.
- **Test tab**: run the `clearTestData` function in Apps Script to empty it.
