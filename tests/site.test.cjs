const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(join(__dirname, "..", "static", "js", "site.js"), "utf8");
const releaseAt = Date.parse("2026-10-09T00:00:00+08:00");

function runSite({
  now = releaseAt - 1,
  hostname = "lost-raven.com",
  search = "",
  hasLink = true,
  visibleAt = "2026-10-09T00:00:00+08:00"
} = {}) {
  let currentTime = now;
  let timerId = 0;
  const timers = new Map();
  const listeners = new Map();
  const storage = new Map([["theme", "dark"]]);
  const link = { hidden: true, getAttribute: () => visibleAt };
  const languageLinks = [{ href: `http://${hostname}/ja/` }];
  const events = {
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name)
  };

  runInNewContext(source, {
    document: {
      querySelector: () => hasLink ? link : null,
      querySelectorAll: () => languageLinks,
      ...events
    },
    window: {
      location: { hostname, search },
      setInterval: callback => {
        timers.set(++timerId, callback);
        return timerId;
      },
      clearInterval: id => timers.delete(id),
      ...events
    },
    localStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value)
    },
    Date: { parse: Date.parse, now: () => currentTime },
    URL,
    URLSearchParams
  });

  return {
    link, timers, listeners, languageLinks, storage,
    setTime: value => { currentTime = value; },
    tick: () => [...timers.values()].forEach(callback => callback()),
    dispatch: name => listeners.get(name)()
  };
}

test("reveals at the exact UTC+8 boundary without a reload and stops its timer", () => {
  const site = runSite();
  assert.equal(releaseAt, Date.parse("2026-10-08T16:00:00Z"));
  assert.equal(site.link.hidden, true);
  assert.equal(site.timers.size, 1);
  site.tick();
  assert.equal(site.link.hidden, true);
  site.setTime(releaseAt);
  site.tick();
  assert.equal(site.link.hidden, false);
  assert.equal(site.timers.size, 0);
  assert.equal(site.listeners.size, 0);
});

test("visits at or after release reveal immediately without starting a timer", () => {
  for (const now of [releaseAt, releaseAt + 86400000]) {
    const site = runSite({ now });
    assert.equal(site.link.hidden, false);
    assert.equal(site.timers.size, 0);
  }
});

test("resuming a background tab or cached page rechecks the current time", () => {
  for (const event of ["visibilitychange", "pageshow"]) {
    const site = runSite();
    site.setTime(releaseAt + 1000);
    site.dispatch(event);
    assert.equal(site.link.hidden, false);
    assert.equal(site.listeners.size, 0);
    assert.equal(site.timers.size, 0);
  }
});

test("local preview reveals early and preserves preview across language links", () => {
  for (const hostname of ["localhost", "127.0.0.1"]) {
    const site = runSite({ hostname, search: "?release-preview=1" });
    assert.equal(site.link.hidden, false);
    assert.equal(site.timers.size, 0);
    assert.equal(new URL(site.languageLinks[0].href).searchParams.get("release-preview"), "1");
  }
});

test("production cannot reveal early via the preview parameter", () => {
  const site = runSite({ search: "?release-preview=1" });
  assert.equal(site.link.hidden, true);
  assert.equal(site.timers.size, 1);
  assert.equal(new URL(site.languageLinks[0].href).search, "");
});

test("pages without a timed link leave the existing theme behavior intact", () => {
  const site = runSite({ hasLink: false });
  assert.equal(site.storage.get("theme"), "dark");
  assert.equal(site.timers.size, 0);
  assert.equal(site.listeners.size, 0);
});

test("invalid visibility dates produce an explicit error", () => {
  assert.throws(() => runSite({ visibleAt: "invalid" }), /Invalid AI statement link visibility date/);
});
