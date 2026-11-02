# Levante website rollback plan

## Known-good production before cutover
- `www.levante-radolfzell.de` CNAME: `ghs.googlehosted.com.`
- Bare domain forwarding: `levante-radolfzell.de` → `https://www.levante-radolfzell.de/`.
- Google Sites remains the current content origin until final cutover.
- Mail routing remains on IONOS: `mx00.ionos.de` and `mx01.ionos.de`.
- SPF, DKIM, DMARC and the public mailbox must not be changed.

## Rollback trigger
Rollback immediately if the new production site has an invalid certificate, widespread 4xx/5xx responses, broken ordering/reservation links, missing legal pages, or an unresolved deployment failure.

## Rollback steps
1. Restore the `www` CNAME to `ghs.googlehosted.com.` in IONOS.
2. Keep the apex forwarding target at `https://www.levante-radolfzell.de/`.
3. Restore the previous Pages custom domain to the preview hostname or remove it from the failed production deployment.
4. Verify the Google Sites homepage, menu, hours, telephone and email.
5. Verify MX/SPF/DKIM/DMARC are unchanged.
6. Record the rollback time, DNS values and verification screenshots.

## Recovery objective
DNS rollback is the only production change required. The previous Google Site remains published, so recovery does not require rebuilding content.
