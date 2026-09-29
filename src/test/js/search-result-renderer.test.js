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

const rendererPath = path.resolve(
  __dirname,
  "../../main/resources/META-INF/resources/alfdockia/community/share/search/SearchResult.js"
);

function renderCompleteResult() {
  let childWidgets = 0;
  let exported;
  const createdNodes = [];

  function declare(bases, properties) {
    function Type() {}
    Type.prototype = properties;
    return Type;
  }

  function Selector() {
    childWidgets++;
  }

  function LegacyRenderer() {
    childWidgets++;
  }

  const domConstruct = {
    create(tag, attributes = {}, parent) {
      const node = { tag, attributes, children: [], innerHTML: attributes.innerHTML || "" };
      createdNodes.push(node);
      if (parent && parent.children) parent.children.push(node);
      return node;
    }
  };

  const dependencies = {
    "dojo/_base/declare": declare,
    "alfresco/lists/views/layouts/Row": function Row() {},
    "alfresco/renderers/Selector": Selector,
    "alfresco/search/SearchResultPropertyLink": LegacyRenderer,
    "alfresco/renderers/PropertyLink": LegacyRenderer,
    "alfresco/renderers/Property": LegacyRenderer,
    "alfresco/renderers/DateLink": LegacyRenderer,
    "alfresco/renderers/Size": LegacyRenderer,
    "dojo/dom-construct": domConstruct,
    "dojo/dom-class": { add() {} },
    "dojo/_base/lang": { exists() { return true; } },
    "alfresco/enums/urlTypes": { PAGE_RELATIVE: "PAGE_RELATIVE" }
  };

  const context = {
    Alfresco: { constants: { URL_PAGECONTEXT: "/share/page/" } },
    define(names, factory) {
      exported = factory(...names.map(name => dependencies[name]));
    },
    encodeURIComponent,
    isNaN,
    parseFloat,
    parseInt,
    String
  };
  vm.runInNewContext(fs.readFileSync(rendererPath, "utf8"), context, { filename: rendererPath });

  const result = new exported();
  result.id = "RESULT";
  result.domNode = { children: [] };
  result.pubSubScope = "";
  result.currentItem = {
    nodeRef: "workspace://SpacesStore/123",
    displayName: "Contrato 2026.pdf",
    title: "Contrato principal",
    description: "Contrato firmado",
    type: "document",
    modifiedOn: "2026-09-16T12:00:00Z",
    modifiedBy: "Administrador",
    modifiedByUser: "admin",
    path: "/Company Home/Sites/legal/documentLibrary/Contratos",
    site: { shortName: "legal", title: "Legal" },
    size: 2048
  };
  result.postCreate();

  return { childWidgets, createdNodes };
}

test("a complete IA result creates only the selector child widget", () => {
  const rendered = renderCompleteResult();
  assert.equal(rendered.childWidgets, 1);
});

test("the lightweight result keeps document, author and folder navigation", () => {
  const links = renderCompleteResult().createdNodes
    .filter(node => node.tag === "a")
    .map(node => node.attributes.href);

  assert.deepEqual(links, [
    "/share/page/site/legal/document-details?nodeRef=workspace%3A%2F%2FSpacesStore%2F123",
    "/share/page/user/admin/profile",
    "/share/page/site/legal/documentlibrary?path=%2FCompany%20Home%2FSites%2Flegal%2FdocumentLibrary%2FContratos"
  ]);
});
