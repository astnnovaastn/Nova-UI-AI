# Google and repository setup

The adapters are implemented in the existing AEGIS Connections panel. They are optional and disabled until their host configuration exists. This implementation did not connect a real account, store a real token or enable a repository.

## Google Calendar and Gmail

1. In your Google Cloud project, enable Gmail API and Google Calendar API.
2. Configure the OAuth consent screen and a Web application OAuth client. For a development app, add your account as a test user.
3. Register the exact callback URL served by your AEGIS backend or frontend API proxy. Its path must be /api/work/google/callback. HTTPS is required except for localhost/loopback development.
4. Configure these server-side values, then restart the AEGIS backend:
   - AEGIS_GOOGLE_CLIENT_ID
   - AEGIS_GOOGLE_CLIENT_SECRET
   - AEGIS_GOOGLE_REDIRECT_URI
5. Open Work → Connections → Connect Google, then click Continue with Google. Consent opens only after that click. Return to AEGIS and refresh status.
6. Read a bounded set of message summaries or a date range of primary-calendar events. Select individual items and inspect the selected-input chips before sending a task.

Do not place the client secret in frontend files or send it through chat. The callback must match the OAuth client registration exactly; no port was assumed or configured during implementation.

Scopes: gmail.readonly and calendar.events.readonly. Gmail returns subject/from/date/snippet metadata only, not full bodies or attachments. Calendar reads the primary calendar. Additional pages are explicitly indicated; narrow the query/date range to inspect them. No send, delete, mark-read, event-create or event-update endpoint exists.

Tokens are encrypted with Windows DPAPI under the host user. Other operating systems require a valid server-only AEGIS_ACCOUNT_ENCRYPTION_KEY (Fernet). State is one-use, expires after ten minutes and uses PKCE. Disconnect removes the local token and cancels pending authorization; revoke the grant separately in your Google account if desired. Public status never exposes tokens. Callback responses do not reflect codes and standard Uvicorn access logging redacts the callback query.

Only explicitly selected summaries enter the normal Work request. Those attachments become part of the local task context; disconnecting does not erase previous task content. Models cannot autonomously browse your other account items.

Official references: [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [Gmail messages list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list), [Calendar events list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).

## Repository excerpts

Configure AEGIS_WORK_REPOSITORIES as a server-side JSON object mapping short IDs to absolute repository paths. Example:

    {"my-project":"C:/Projects/my-project"}

The Connections panel lists only configured roots. Choose a file and an explicit line range. The response includes line numbers, total line count and a SHA-256 revision. The source content is shown before it is attached to the next task.

Reads are confined to the configured root after path resolution, exclude hidden/configuration/credential files and generated dependency directories, reject traversal and alternate streams, and accept text source types only. Inventory is bounded to 1,000 files/3,000 directories. Files are at most 512 KB; excerpts are at most 200 lines and 11,000 characters. Larger excerpts fail with a request to narrow the range instead of silently truncating.

This is a read-only source adapter. It is not a security sandbox for executing an untrusted repository. Test execution, command execution and file writes are unavailable. Proposed diffs remain proposals.

## Offline verification

test_work_google.py covers authorization, scope isolation, refresh, cancellation, encrypted fixture tokens, route access and log redaction. test_work_repositories.py covers configured roots, traversal/sensitive-path rejection, bounded excerpts, revision changes and owner-only read routes. Google UI fixtures use injected synthetic data. No real Google API or repository execution is used by these checks.

