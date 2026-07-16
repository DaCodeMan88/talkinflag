/** UA detection for embedded webviews where Google OAuth is blocked
 *  (403 disallowed_useragent). Used to steer users to magic-link sign-in.
 *
 *  Leading \b only: a trailing \b would fail on tokens like
 *  "musical_ly_2022..." (underscore is a word char, so no boundary).
 *  The leading \b still prevents e.g. "Outline/" matching "Line/". */
const IN_APP_UA =
  /\b(Instagram|FBAN|FBAV|FB_IAB|Messenger|WhatsApp|Line\/|MicroMessenger|musical_ly|TikTok|Snapchat)/i;

export function isInAppBrowser(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return IN_APP_UA.test(userAgent);
}
