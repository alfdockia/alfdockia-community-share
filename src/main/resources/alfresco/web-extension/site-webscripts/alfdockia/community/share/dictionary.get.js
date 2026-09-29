/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
function responseText(result)
{
   return result && result.response !== undefined ? String(result.response) : String(result || "");
}

function classList(value)
{
   if (Array.isArray(value)) { return value; }
   if (value && Array.isArray(value.classes)) { return value.classes; }
   if (value && Array.isArray(value.data)) { return value.data; }
   return [];
}

function propertyList(value)
{
   if (Array.isArray(value)) { return value; }
   if (!value || typeof value !== "object") { return []; }
   var result = [], key;
   for (key in value)
   {
      if (value.hasOwnProperty(key))
      {
         if (typeof value[key] === "object") { value[key].name = value[key].name || key; result.push(value[key]); }
      }
   }
   return result;
}

function normalizeClass(item, properties)
{
   var names = [], props = propertyList(item.properties), i, prop, name;
   for (i = 0; i < props.length; i++)
   {
      prop = props[i];
      name = String(prop.name || "");
      if (!name) { continue; }
      names.push(name);
      properties[name] = {
         name: name,
         title: String(prop.title || prop.label || name),
         dataType: String(prop.dataType || prop.type || "d:text"),
         multiValued: prop.multiValued === true,
         mandatory: prop.mandatory === true
      };
   }
   names.sort();
   return {
      name: String(item.name || item.id || ""),
      title: String(item.title || item.label || item.name || item.id || ""),
      parent: String(item.parent || item.parentName || ""),
      properties: names
   };
}

function main()
{
   var result = remote.call("/api/classes?cf=all"), code = result && result.status,
      raw, classes, types = [], aspects = [], properties = {}, i, item, normalized;
   code = typeof code === "object" ? code.code : code;
   if (code < 200 || code >= 300)
   {
      status.code = 502;
      model.json = jsonUtils.toJSONString({ error: "No se pudo cargar el diccionario de Alfresco." });
      return;
   }
   raw = JSON.parse(responseText(result));
   classes = classList(raw);
   for (i = 0; i < classes.length; i++)
   {
      item = classes[i];
      normalized = normalizeClass(item, properties);
      if (!normalized.name) { continue; }
      (item.isAspect === true || item.aspect === true ? aspects : types).push(normalized);
   }
   function compare(a, b) { return (a.title + a.name).localeCompare(b.title + b.name); }
   types.sort(compare); aspects.sort(compare);
   model.json = jsonUtils.toJSONString({ types: types, aspects: aspects, properties: properties });
}

main();
