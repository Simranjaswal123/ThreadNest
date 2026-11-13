// This demo shop has no email service. "Sending" an email means writing it to the server log
// (the terminal locally, or the Logs page on Render), where the link can be copied.
// A real email provider could replace this one function later without changing anything else.

// The tests read the messages from here instead of the log.
export const outbox = [];

export function sendPasswordResetEmail(to, link) {
  if (process.env.NODE_ENV === 'test') {
    outbox.push({ to: to, link: link });
    return;
  }
  console.log('[email] To: ' + to + ' | Reset your Threadnest password (valid for 30 minutes): ' + link);
}
