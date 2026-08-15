# Production access boundary

Every operator and automation must verify both identifiers before reading from
or writing to Supabase production.

## Allowed target

- Organization: `OSC Web Design`
- Organization ID: `mssvratfrcoopldovppa`
- Project: `My Contract Doctors`
- Project ref: `xrchncayomnwcnphrwhx`

## Explicitly prohibited

- Organization: `Honor Pet`
- Organization ID: `kwpqpahyjzbjqassynog`
- Project ref currently associated with Honor Pet: `zuvpabafsumobexzeuql`

Never inspect, link, query, migrate, deploy to, or otherwise access Honor Pet
while working in this repository. If any expected identifier does not match the
allowed target exactly, stop before performing the operation.
