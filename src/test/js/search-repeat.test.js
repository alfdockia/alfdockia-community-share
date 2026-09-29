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

const resources = path.resolve(
  __dirname,
  "../../main/resources/META-INF/resources/alfdockia/community/share"
);

function declare(bases, properties) {
  function Type() {}
  Type.prototype = Object.assign({}, ...bases.map(base => base.prototype), properties);
  return Type;
}

function AlfSearchList() {}
AlfSearchList.prototype._resetVars = ["facetFilters", "query"];

function loadAmd(relativePath, dependencies) {
  const file = path.join(resources, relativePath);
  assert.equal(
    fs.existsSync(file),
    true,
    `Falta el módulo de producción ${relativePath}`
  );

  let exported;
  const context = {
    Alfresco: { constants: { URL_SERVICECONTEXT: "/share/service/" } },
    Date,
    decodeURIComponent,
    define(names, factory) {
      exported = factory(...names.map(name => dependencies[name]));
    },
    isNaN,
    parseInt,
    String
  };

  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return exported;
}

test("repeating an IA search keeps its marker while clearing facet filters", () => {
  const SearchList = loadAmd("search/SearchList.js", {
    "dojo/_base/declare": declare,
    "alfresco/search/AlfSearchList": AlfSearchList,
    "dojo/json": JSON
  });
  const list = new SearchList();
  const query = encodeURIComponent(JSON.stringify({
    alfdockiaCommunityShareSearch: true,
    alfdockiaCommunityShareQuery: "contratos indefinidos"
  }));
  const hash = { query, facetFilters: "TYPE%3Acm%3Acontent" };

  const changed = list._cleanResettableHashTerms(hash);

  assert.equal(changed, true);
  assert.equal(hash.query, query);
  assert.equal("facetFilters" in hash, false);
});

test("a regular Alfresco search keeps the inherited hash cleanup", () => {
  const SearchList = loadAmd("search/SearchList.js", {
    "dojo/_base/declare": declare,
    "alfresco/search/AlfSearchList": AlfSearchList,
    "dojo/json": JSON
  });
  const list = new SearchList();
  const hash = { query: "TYPE:cm:content", facetFilters: "creator|admin" };
  let delegated = false;
  list.inherited = function () {
    delegated = true;
    delete hash.query;
    delete hash.facetFilters;
    return true;
  };

  const changed = list._cleanResettableHashTerms(hash);

  assert.equal(delegated, true);
  assert.equal(changed, true);
  assert.deepEqual(hash, {});
});

test("the IA service sends the current search box text instead of a stale serialized query", () => {
  const SearchService = loadAmd("services/SearchService.js", {
    "dojo/_base/declare": declare,
    "alfresco/services/SearchService": function SearchService() {},
    "alfresco/core/topics": { SEARCH_REQUEST: "SEARCH_REQUEST" },
    "dojo/json": JSON
  });
  const service = new SearchService();
  let request;
  service.serviceXhr = config => { request = config; };

  service._onAlfDockiaCommunityShareRequest(
    { term: "consulta nueva", pageSize: 25 },
    { alfdockiaCommunityShareSearch: true, alfdockiaCommunityShareQuery: "consulta anterior" }
  );

  assert.equal(request.query.query, "consulta nueva");
  assert.equal(request.query.q, "consulta nueva");
  assert.equal(request.query.term, "consulta nueva");
});
