/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const resources = path.resolve(__dirname, "../../main/resources/META-INF/resources/alfdockia-community-share/js");

function loadScript(name, Alfresco) {
  const context = {
    Alfresco,
    YAHOO: {
      lang: {
        JSON,
        later() {},
        substitute(template) { return template; }
      },
      util: {
        Connect: { asyncRequest() {} },
        Dom: {
          addClass() {},
          get() { return null; },
          getElementsByClassName() { return []; },
          removeClass() {}
        },
        Event: { preventDefault() {} }
      }
    },
    document: { getElementById() { return null; } },
    window: { JSON, location: { href: "" } }
  };

  vm.runInNewContext(
    fs.readFileSync(path.join(resources, name), "utf8"),
    context,
    { filename: name }
  );
  return context;
}

test("Node Browser routes IA-Search but not the removed IA-Analytics language", () => {
  function ConsoleNodeBrowser() {}
  ConsoleNodeBrowser.prototype.onReady = function () {};
  ConsoleNodeBrowser.prototype.onHistoryManagerReady = function () {};

  const Alfresco = {
    AlfDockiaCommunityShare: { NodeBrowser: { language: "IA-Search" } },
    ConsoleNodeBrowser,
    constants: { URL_SERVICECONTEXT: "/share/service/" }
  };
  loadScript("node-browser.js", Alfresco);

  const browser = new ConsoleNodeBrowser();
  const config = browser._alfdockiaCommunityShareConfig();
  assert.equal(browser._alfdockiaCommunityShareRequestMode("?lang=IA-Search", config), "search");
  assert.equal(browser._alfdockiaCommunityShareRequestMode("?lang=IA-Analytics", config), null);
});

test("Advanced Search recognizes only the IA search form", () => {
  function AdvancedSearch() {}
  AdvancedSearch.prototype.renderFormTemplate = function () {};
  AdvancedSearch.prototype.onSearchClick = function () {};

  const Alfresco = {
    AdvancedSearch,
    constants: { URL_PAGECONTEXT: "/share/page/", URL_SERVICECONTEXT: "/share/service/" }
  };
  loadScript("advanced-search.js", Alfresco);

  const search = new AdvancedSearch();
  assert.equal(search._isAlfDockiaCommunityShareAdvancedForm({ type: "alfdockia-community-share-search" }), true);
  assert.equal(search._isAlfDockiaCommunityShareAdvancedForm({ type: "alfdockia-community-share-analytics" }), false);
});

test("Advanced Search selects bulk mode only when exhaustive traversal is enabled", () => {
  function AdvancedSearch() {}
  AdvancedSearch.prototype.renderFormTemplate = function () {};
  AdvancedSearch.prototype.onSearchClick = function () {};
  const Alfresco = {
    AdvancedSearch,
    constants: { URL_PAGECONTEXT: "/share/page/", URL_SERVICECONTEXT: "/share/service/" }
  };
  const context = loadScript("advanced-search.js", Alfresco);
  const search = new AdvancedSearch(); search.id = "ADV";

  context.YAHOO.util.Dom.get = id => id === "ADV-alfdockia-community-share-bulk" ? { checked: true } : null;
  assert.equal(search._alfdockiaCommunityShareAdvancedMode(), "bulk");
  context.YAHOO.util.Dom.get = () => ({ checked: false });
  assert.equal(search._alfdockiaCommunityShareAdvancedMode(), "interactive");
});
