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

const file = path.resolve(__dirname, "../../main/resources/META-INF/resources/alfdockia-community-share/js/metadata-filters.js");

function library() {
  const context = { Alfresco: {}, YAHOO: { lang: { JSON } }, decodeURIComponent, encodeURIComponent };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return context.Alfresco.AlfDockiaCommunityShare.MetadataFilters;
}

test("operators follow Alfresco property datatype", () => {
  const filters = library();
  assert.deepEqual(Array.from(filters.operatorsFor({ dataType: "d:boolean" }), x => x.value), ["eq", "ne", "exists", "not_exists"]);
  assert.deepEqual(Array.from(filters.operatorsFor({ dataType: "d:date" }), x => x.value), ["eq", "before", "after", "between", "exists", "not_exists"]);
});

test("filter contract survives URL round trip", () => {
  const filters = library();
  const contract = { version: 1, types: ["acme:contract"], aspects: ["cm:titled"], properties: [
    { name: "acme:vivienda", operator: "eq", value: true, dataType: "d:boolean" }
  ] };
  assert.deepEqual(JSON.parse(JSON.stringify(filters.decode(filters.encode(contract)))), contract);
});
