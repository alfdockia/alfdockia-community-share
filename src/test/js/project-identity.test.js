/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "../../..");

function read(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
}

function maintainedFiles(directory = projectRoot) {
  const ignoredDirectories = new Set([".git", ".superpowers", "target"]);
  const ignoredFiles = new Set([
    "LICENSE",
    "project-identity.test.js",
    "2026-09-29-alfdockia-community-share-refactor-design.md",
    "2026-09-29-alfdockia-community-share-refactor.md"
  ]);
  const result = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...maintainedFiles(absolutePath));
    else if (!ignoredFiles.has(entry.name) && path.extname(entry.name) !== ".md") result.push(absolutePath);
  }
  return result;
}

test("project manifests expose the canonical identity", () => {
  const pom = read("pom.xml");
  const moduleProperties = read("src/main/resources/alfresco/module/alfdockia-community-share/module.properties");
  const aikauExtension = read("src/main/resources/alfresco/web-extension/site-data/extensions/alfdockia-community-share-aikau.xml");

  assert.match(pom, /<groupId>alfdockia\.community\.share<\/groupId>/);
  assert.match(pom, /<artifactId>alfdockia-community-share<\/artifactId>/);
  assert.match(pom, /<version>1\.0\.0<\/version>/);
  assert.match(pom, /<name>AlfDockia Community Share<\/name>/);
  assert.match(pom, /<name>AIgen Technologies S\.L\.<\/name>/);
  assert.match(pom, /<name>GNU Affero General Public License v3\.0<\/name>/);
  assert.match(moduleProperties, /^module\.id=alfdockia-community-share$/m);
  assert.match(moduleProperties, /^module\.version=1\.0\.0$/m);
  assert.match(aikauExtension, /<id>AlfDockia Community Share Aikau Package<\/id>/);
  assert.match(aikauExtension, /<version>1\.0\.0<\/version>/);
});

test("maintained files do not contain legacy identities", () => {
  const forbidden = /alfdokia|Alfdockia|com[./]cparedes|com\.cparedes|1\.0-SNAPSHOT/;
  const violations = maintainedFiles()
    .filter(file => forbidden.test(fs.readFileSync(file, "utf8")))
    .map(file => path.relative(projectRoot, file));

  assert.deepEqual(violations, []);
});

test("docker and launchers use the canonical service prefix", () => {
  for (const relativePath of ["docker/docker-compose.yml", "run.sh", "run.bat"]) {
    const contents = read(relativePath);
    assert.match(contents, /alfdockia-community-share/, relativePath);
    assert.doesNotMatch(contents, /alfdokia-ai-share/i, relativePath);
  }
});

test("README documents the canonical Share module", () => {
  const readme = read("README.md");

  assert.match(readme, /alfdockia\.community\.share:alfdockia-community-share:1\.0\.0/);
  assert.match(readme, /\/share\/service\/alfdockia-community-share\/search/);
  assert.match(readme, /\/share\/service\/alfdockia-community-share\/dictionary/);
  assert.match(readme, /POST `?\/search`?/);
  assert.match(readme, /node --test src\/test\/js\/\*\.test\.js/);
  assert.match(readme, /mvn clean package/);
  assert.match(readme, /Search e Indexer son\s+servicios externos/);
});

test("README files end with the legal notice", () => {
  const expectations = [
    ["README.md", "LICENSE"],
    ["src/main/assembly/web/README.md", "../../../../LICENSE"]
  ];
  const footer = /Copyright \(C\) 2026 AIgen Technologies S\.L\.\nLicenciado bajo GNU Affero General Public License v3\.0 \(\[LICENSE\]\(([^)]+)\)\)\.\s*$/;

  for (const [relativePath, licenseTarget] of expectations) {
    const match = read(relativePath).match(footer);
    assert.ok(match, `${relativePath} no termina con el aviso legal`);
    assert.equal(match[1], licenseTarget, relativePath);
    assert.equal(fs.existsSync(path.resolve(path.dirname(path.join(projectRoot, relativePath)), licenseTarget)), true, relativePath);
  }
});

test("technical documentation belongs to the Share repository", () => {
  const expected = [
    "docs/architecture.md",
    "docs/javascript-api.md",
    "docs/webscripts.md",
    "docs/configuration.md",
    "docs/licensing.md"
  ];
  const retired = [
    "docs/busquedas-simples-hibridas-complejas.md",
    "docs/superpowers/plans/scalable-hybrid-search-implementation.md",
    "docs/superpowers/plans/search-deterministic-filters-implementation.md",
    "docs/superpowers/specs/2026-09-16-scalable-hybrid-search-design.md",
    "docs/superpowers/specs/2026-09-16-search-deterministic-filters-design.md"
  ];

  for (const relativePath of expected) {
    const contents = read(relativePath);
    assert.notEqual(contents, "", relativePath);
    assert.doesNotMatch(contents, /alfdokia|com[./]cparedes|1\.0-SNAPSHOT/i, relativePath);
  }
  for (const relativePath of retired) {
    assert.equal(fs.existsSync(path.join(projectRoot, relativePath)), false, relativePath);
  }
});

test("build and execution artifacts are ignored", () => {
  const gitignore = read(".gitignore");

  assert.match(gitignore, /^target\/$/m);
  assert.match(gitignore, /^\.superpowers\/$/m);
});

test("legacy source directories are absent", () => {
  for (const relativePath of [
    "src/main/java/com/cparedesr",
    "src/test/java/com/cparedesr",
    "src/main/resources/META-INF/js/aikau/1.1.3/alfdokia"
  ]) {
    assert.equal(fs.existsSync(path.join(projectRoot, relativePath)), false, relativePath);
  }
});

test("POSIX launcher has valid shell syntax", () => {
  const result = childProcess.spawnSync("sh", ["-n", path.join(projectRoot, "run.sh")], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
});
