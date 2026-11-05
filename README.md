# AnQor Employee Timesheet Portal

A timesheet form that emails each submission, as one formatted HTML table, to your Gmail through [Resend](https://resend.com). It runs on [Vercel](https://vercel.com). The API key and recipient addresses live only in Vercel environment variables and never appear in browser code.

## Files

| File | Purpose |
|---|---|
| `index.html` | The timesheet form (same design and fields as before). |
| `api/submit.js` | Vercel serverless function. Validates the form, builds the HTML email and sends it with Resend. |
| `package.json` | Project metadata (no dependencies needed). |
| `.env.example` | Names of the environment variables to create. Contains no real secrets. |
| `.gitignore` | Keeps `.env` files and `.vercel` out of GitHub. |

## Step 1: Set up Resend

1. Create an account at https://resend.com. **Sign up with the same Gmail address that should receive the timesheets.**
2. Go to **API Keys** > **Create API Key** (permission: *Sending access*). Copy the key (it starts with `re_`). You will only see it once.

That is all you need to send to your own Gmail. Resend's built-in test sender (`onboarding@resend.dev`) can only deliver to the email address on your Resend account, which is exactly this case.

Later, if you want a custom sender or more recipients, verify your company domain under **Domains** in Resend, then add a `FROM_EMAIL` variable (see Step 3).

## Step 2: Put the project on GitHub

1. Create a new **private** repository at https://github.com/new (for example `timesheet-portal`). Do not add a README or .gitignore there.
2. In a terminal, from this folder:

```bash
git init
git add .
git commit -m "Timesheet portal"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/timesheet-portal.git
git push -u origin main
```

(Or use GitHub's **Add file > Upload files** and upload everything, keeping the `api` folder intact.)

## Step 3: Deploy on Vercel

1. Sign in at https://vercel.com (you can use your GitHub account).
2. Click **Add New > Project**, pick the `timesheet-portal` repository and click **Import**.
3. Leave the framework as **Other** and leave build settings empty. Do **not** click Deploy yet.
4. Open **Environment Variables** and add these (apply to Production, Preview and Development):

| Name | Value |
|---|---|
| `RESEND_API_KEY` | your Resend key, `re_...` |
| `RECIPIENT_EMAILS` | your Gmail address (separate several addresses with commas) |
| `FROM_EMAIL` | *optional.* Only after verifying a domain, e.g. `AnQor Timesheets <timesheets@yourdomain.com>` |

5. Click **Deploy**. When it finishes, Vercel gives you a URL such as `https://timesheet-portal.vercel.app`. Share that link with technicians.

If you change an environment variable later, go to **Deployments**, open the latest one and choose **Redeploy**. Changes only apply to new deployments.

## Step 4: Test

1. Open your Vercel URL, fill in a test timesheet and click **Submit Timesheet**.
2. You should see "Timesheet submitted successfully." and the email with the table should arrive in your Gmail (check Spam the first time).
3. If you see an error, check **Vercel > your project > Logs** (filter for `/api/submit`) and **Resend > Logs**.

Common causes: `RECIPIENT_EMAILS` is not the same address you signed up to Resend with (when no `FROM_EMAIL` is set), the API key was pasted with spaces, or you did not redeploy after adding the variables.

## Optional: run locally

```bash
npm i -g vercel
cp .env.example .env.local   # then fill in real values
vercel dev
```

Open http://localhost:3000.

## Notes

- If you list several addresses in `RECIPIENT_EMAILS`, they all go in one Resend request, so everyone gets the same email at the same time.
- The function rejects submissions with no name, no signature or no hours, and ignores a hidden spam-trap field.
- The old preview link from Claude cannot submit, because that page cannot reach an outside server. Use the Vercel URL.
