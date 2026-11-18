// V31 blocker: the host rules AEGIS applies from the bundled EasyList and EasyPrivacy.
const test = require("node:test");
const assert = require("node:assert");
const { parseLists, decide, loadRules } = require("../desktop/blocker.cjs");

test("host rules, exceptions and options", () => {
  const rules = parseLists(["||ads.example^\n||track.example^$third-party\n||pix.example^$image\n@@||ok.ads.example^\n||scoped.example^$domain=a.com\nexample.com##.banner"]);
  const at = (url, resourceType = "script", pageHost = "news.site") => decide(rules, { url, resourceType, pageHost }).block;
  assert.equal(at("https://ads.example/a.js"), true);
  assert.equal(at("https://cdn.ads.example/a.js"), true, "subdomains of a listed host");
  assert.equal(at("https://ok.ads.example/a.js"), false, "an exception wins");
  assert.equal(at("https://ads.example/", "mainFrame"), false, "the page itself is never blocked");
  assert.equal(at("https://track.example/t", "xhr", "www.track.example"), false, "third-party rule on its own site");
  assert.equal(at("https://track.example/t", "xhr"), true);
  assert.equal(at("https://pix.example/p", "script"), false, "type-limited rule");
  assert.equal(at("https://pix.example/p.gif", "image"), true);
  assert.equal(at("https://scoped.example/x"), false, "domain= rules are not applied");
  assert.equal(decide(rules, { url: "https://ads.example/a.js", resourceType: "script", pageHost: "news.site" }, new Set(["news.site"])).block, false, "an allowed site");
});

test("the bundled lists block well-known trackers and leave ordinary sites alone", () => {
  const rules = loadRules();
  assert.ok(rules.block.size > 50000, `host rules: ${rules.block.size}`);
  const at = (url, type = "script") => decide(rules, { url, resourceType: type, pageHost: "www.theverge.com" }).block;
  assert.equal(at("https://www.google-analytics.com/analytics.js"), true);
  assert.equal(at("https://securepubads.g.doubleclick.net/tag/js/gpt.js"), true);
  assert.equal(at("https://www.wikipedia.org/static/x.js"), false);
  assert.equal(at("https://cdn.jsdelivr.net/npm/x.js"), false);
});
