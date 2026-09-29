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

test("Aikau sends metadata filters separately from natural language", () => {
  let Exported;
  function SearchService() {}
  function declare(bases, properties) { function Type() {} Type.prototype = properties; return Type; }
  const context = {
    Alfresco: { constants: { URL_SERVICECONTEXT: "/share/service/" } }, Date,
    decodeURIComponent, define(names, factory) {
      Exported = factory(...names.map(name => ({
        "dojo/_base/declare": declare,
        "alfresco/services/SearchService": SearchService,
        "alfresco/core/topics": { SEARCH_REQUEST: "SEARCH" },
        "dojo/json": JSON
      })[name]));
    }, isNaN, parseInt, String
  };
  const file = path.resolve(__dirname, "../../main/resources/META-INF/resources/alfdockia/community/share/services/SearchService.js");
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  const service = new Exported(); let request;
  service.pageSize = 25; service.startIndex = 0; service.serviceXhr = value => { request = value; };
  const contract = { version: 1, types: ["acme:contract"], aspects: [], properties: [] };
  service._onAlfDockiaCommunityShareRequest({ term: "contratos", pageSize: 25 }, { alfdockiaCommunityShareSearch: true, alfdockiaCommunityShareQuery: "contratos", alfdockiaCommunityShareFilters: contract });
  assert.deepEqual(JSON.parse(request.query.metadataFilters), contract);
  assert.equal(request.query.query, "contratos");
  assert.equal("rerankCandidates" in request.query, false);
  assert.equal(request.url, "/share/service/alfdockia-community-share/search");
  service.alfdockiaCommunityShareAPI = "/custom/community-search";
  assert.equal(service._alfdockiaCommunityShareUrl(), "/custom/community-search");
});

test("Aikau transports hybrid mode and opaque cursor without converting it to an offset", () => {
  let Exported;
  function SearchService() {}
  function declare(bases, properties) { function Type() {} Type.prototype = properties; return Type; }
  const context = {
    Alfresco: { constants: { URL_SERVICECONTEXT: "/share/service/" } }, Date,
    decodeURIComponent, define(names, factory) {
      Exported = factory(...names.map(name => ({
        "dojo/_base/declare": declare,
        "alfresco/services/SearchService": SearchService,
        "alfresco/core/topics": { SEARCH_REQUEST: "SEARCH" },
        "dojo/json": JSON
      })[name]));
    }, isNaN, parseInt, String
  };
  const file = path.resolve(__dirname, "../../main/resources/META-INF/resources/alfdockia/community/share/services/SearchService.js");
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  const service = new Exported(); let request;
  service.pageSize = 25; service.startIndex = 0; service.serviceXhr = value => { request = value; };

  service._onAlfDockiaCommunityShareRequest(
    { term: "contratos", pageSize: 25, startIndex: 25 },
    { alfdockiaCommunityShareSearch: true, alfdockiaCommunityShareQuery: "contratos", alfdockiaCommunityShareMode: "bulk", alfdockiaCommunityShareCursor: "signed.opaque", alfdockiaCommunityShareIncludeTotal: true }
  );

  assert.equal(request.query.mode, "bulk");
  assert.equal(request.query.cursor, "signed.opaque");
  assert.equal(request.query.includeTotal, true);
  assert.equal(request.query.skipCount, 0);
});

test("Aikau reuses the returned cursor for the next page of the same search", () => {
  let Exported;
  function SearchService() {}
  function declare(bases, properties) { function Type() {} Type.prototype = properties; return Type; }
  const context = {
    Alfresco: { constants: { URL_SERVICECONTEXT: "/share/service/" } }, Date,
    decodeURIComponent, define(names, factory) {
      Exported = factory(...names.map(name => ({
        "dojo/_base/declare": declare,
        "alfresco/services/SearchService": SearchService,
        "alfresco/core/topics": { SEARCH_REQUEST: "SEARCH" },
        "dojo/json": JSON
      })[name]));
    }, isNaN, parseInt, String
  };
  const file = path.resolve(__dirname, "../../main/resources/META-INF/resources/alfdockia/community/share/services/SearchService.js");
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  const service = new Exported(); const requests = [];
  service.pageSize = 2; service.startIndex = 0;
  service.serviceXhr = value => { requests.push(value); };
  service.alfPublish = () => {};
  const descriptor = { alfdockiaCommunityShareSearch: true, alfdockiaCommunityShareQuery: "contratos", alfdockiaCommunityShareMode: "interactive" };

  service._onAlfDockiaCommunityShareRequest({ term: "contratos", pageSize: 2, startIndex: 0 }, descriptor);
  service._onAlfDockiaCommunityShareSuccess(
    { list: { pagination: { cursor: "page.two", count: 2 }, entries: [] } }, requests[0]
  );
  service._onAlfDockiaCommunityShareRequest({ term: "contratos", pageSize: 2, startIndex: 2 }, descriptor);

  assert.equal(requests[1].query.cursor, "page.two");
  assert.equal(requests[1].query.skipCount, 0);
});

test("Aikau keeps next-page navigation when interactive total is intentionally unknown", () => {
  let Exported;
  function SearchService() {}
  function declare(bases, properties) { function Type() {} Type.prototype = properties; return Type; }
  const context = {
    Alfresco: { constants: { URL_SERVICECONTEXT: "/share/service/" } }, Date,
    decodeURIComponent, define(names, factory) {
      Exported = factory(...names.map(name => ({
        "dojo/_base/declare": declare,
        "alfresco/services/SearchService": SearchService,
        "alfresco/core/topics": { SEARCH_REQUEST: "SEARCH" },
        "dojo/json": JSON
      })[name]));
    }, isNaN, parseInt, String
  };
  const file = path.resolve(__dirname, "../../main/resources/META-INF/resources/alfdockia/community/share/services/SearchService.js");
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  const service = new Exported();
  service._toShareSearchItem = item => item;

  const result = service._toShareSearchResponse(
    { list: { pagination: { totalItems: null, totalItemsExact: false, hasMoreItems: true, count: 2, cursor: "next" }, entries: [{ nodeRef: "a" }, { nodeRef: "b" }] } },
    { alfdockiaCommunityShareDisplayStartIndex: 0, maxItems: 2 }
  );

  assert.equal(result.startIndex, 0);
  assert.equal(result.numberFound, 3);
  assert.equal(result.totalItemsExact, false);
  assert.equal(result.cursor, "next");
});

test("Share webscript keeps the remote search path", () => {
  const file = path.resolve(
    __dirname,
    "../../main/resources/alfresco/web-extension/site-webscripts/alfdockia/community/share/search.get.js"
  );
  const source = fs.readFileSync(file, "utf8");

  assert.match(source, /configValue\(root, "search-path", "\/search"\)/);
});
