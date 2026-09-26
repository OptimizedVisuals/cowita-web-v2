/**
 * CoWiTa site configuration.
 *
 * FORM_ENDPOINT points at the Google Apps Script web app that stores every
 * submission in the "CoWiTa Form Submissions" Google Sheet and sends
 * confirmation emails. See apps-script/SETUP.md for how to deploy it and
 * paste the /exec URL here.
 *
 * Until the URL is filled in, forms show a friendly "not configured yet"
 * message instead of failing silently.
 */
window.COWITA_CONFIG = {
  /** Apps Script web app /exec URL. */
  FORM_ENDPOINT: '',
};
