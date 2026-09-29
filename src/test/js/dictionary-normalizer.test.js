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

const file = path.resolve(__dirname, "../../main/resources/alfresco/web-extension/site-webscripts/alfdockia/community/share/dictionary.get.js");

test("dictionary webscript normalizes types aspects and shared properties", () => {
  const response = { classes: [
    { name: "acme:contract", title: "Contrato", parent: "cm:content", isAspect: false, properties: [{ name: "acme:vivienda", title: "Vivienda", dataType: "d:boolean" }] },
    { name: "cm:titled", title: "Titulado", parent: "", isAspect: true, properties: [{ name: "cm:title", title: "Título", dataType: "d:text" }] }
  ] };
  const context = {
    remote: { call() { return { status: 200, response: JSON.stringify(response) }; } },
    JSON, jsonUtils: { toJSONString: JSON.stringify }, model: {}, status: {}
  };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  const result = JSON.parse(context.model.json);
  assert.equal(result.types[0].name, "acme:contract");
  assert.equal(result.aspects[0].name, "cm:titled");
  assert.equal(result.properties["acme:vivienda"].dataType, "d:boolean");
});
