# Lost Raven

Multilingual Hugo website for Lost Raven Records and Finale Radio.

## Development

```powershell
hugo server
```

The hello-friend-ng theme requires an extended Hugo build. Pushes to `main`
are deployed automatically to [lost-raven.com](https://lost-raven.com/).

## AI creative statement

The statement is available at `/ai/` (English), `/ja/ai/` (Japanese), and
`/zh-cn/ai/` (Simplified Chinese). English is the reference text. Content lives in
the multilingual [AI page bundle](content/ai).

The homepage footer link becomes visible at **October 9, 2026, 00:00 UTC+8**,
including for visitors who leave the page open or return to a background tab.
The pages themselves are published immediately, independently of the link timer;
they can be accessed directly and appear in the sitemap before that date.
With JavaScript disabled, the timed homepage link remains hidden.

To preview the revealed link locally, open `/?release-preview=1` (or the localized
homepage equivalent). This override only works on `localhost` and `127.0.0.1`.

Run the timer regression tests with Node.js:

```powershell
node --test tests\site.test.cjs
```
