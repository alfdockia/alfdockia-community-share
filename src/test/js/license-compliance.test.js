/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "../../..");
const copyright = "SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.";
const license = "SPDX-License-Identifier: AGPL-3.0-only";
const licenseSha256 = "3b36a68fb5395b151eff6459b148607b041f2a44c2bcbc4d08a452c05011f98c";

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolutePath));
    else files.push(absolutePath);
  }
  return files;
}

function maintainedSources() {
  const explicit = [
    path.join(projectRoot, "pom.xml"),
    path.join(projectRoot, "docker/docker-compose.yml"),
    path.join(projectRoot, "run.sh"),
    path.join(projectRoot, "run.bat")
  ];
  const sourceExtensions = new Set([".css", ".ftl", ".js", ".properties", ".xml"]);
  const sourceTree = walk(path.join(projectRoot, "src"))
    .filter(file => sourceExtensions.has(path.extname(file)))
    .filter(file => !file.endsWith(".min.js"));
  const dockerFiles = walk(path.join(projectRoot, "src/main/docker"))
    .filter(file => path.basename(file) === "Dockerfile");
  return [...new Set([...explicit, ...sourceTree, ...dockerFiles])];
}

test("maintained source files declare copyright and license", () => {
  const violations = maintainedSources()
    .filter(file => {
      const source = fs.readFileSync(file, "utf8");
      return !source.includes(copyright) || !source.includes(license);
    })
    .map(file => path.relative(projectRoot, file));

  assert.deepEqual(violations, []);
});

test("generated minified JavaScript carries a legal banner", () => {
  const violations = walk(path.join(projectRoot, "src/main"))
    .filter(file => file.endsWith(".min.js"))
    .filter(file => {
      const source = fs.readFileSync(file, "utf8");
      return !source.includes(copyright) || !source.includes(license);
    })
    .map(file => path.relative(projectRoot, file));

  assert.deepEqual(violations, []);
});

test("LICENSE remains unchanged", () => {
  const contents = fs.readFileSync(path.join(projectRoot, "LICENSE"));
  assert.equal(crypto.createHash("sha256").update(contents).digest("hex"), licenseSha256);
});

test("NOTICE and Maven metadata agree", () => {
  const notice = fs.existsSync(path.join(projectRoot, "NOTICE"))
    ? fs.readFileSync(path.join(projectRoot, "NOTICE"), "utf8")
    : "";
  const pom = fs.readFileSync(path.join(projectRoot, "pom.xml"), "utf8");

  for (const expected of ["AlfDockia Community Share", "2026 AIgen Technologies S.L.", "GNU Affero General Public License v3.0", "AGPL-3.0-only"]) {
    assert.match(notice, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(pom, /<name>AlfDockia Community Share<\/name>/);
  assert.match(pom, /<name>AIgen Technologies S\.L\.<\/name>/);
  assert.match(pom, /<name>GNU Affero General Public License v3\.0<\/name>/);
});

test("Maven packages LICENSE and NOTICE in META-INF", () => {
  const pom = fs.readFileSync(path.join(projectRoot, "pom.xml"), "utf8");

  assert.match(pom, /<id>copy-legal-notices<\/id>/);
  assert.match(pom, /<outputDirectory>\$\{project\.build\.outputDirectory\}\/META-INF<\/outputDirectory>/);
  assert.match(pom, /<include>LICENSE<\/include>/);
  assert.match(pom, /<include>NOTICE<\/include>/);
});
