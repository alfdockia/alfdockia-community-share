/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
(function(root)
{
   var Alfresco = root.Alfresco = root.Alfresco || {};
   Alfresco.AlfDockiaCommunityShare = Alfresco.AlfDockiaCommunityShare || {};

   function copyList(value)
   {
      return value && value.length ? Array.prototype.slice.call(value) : [];
   }

   function operatorsFor(property)
   {
      var type = property && property.dataType || "d:text", values;
      if (type === "d:boolean")
      {
         values = ["eq", "ne", "exists", "not_exists"];
      }
      else if (/^d:(int|long|float|double|decimal)$/.test(type))
      {
         values = ["eq", "ne", "gt", "gte", "lt", "lte", "between", "exists", "not_exists"];
      }
      else if (type === "d:date" || type === "d:datetime")
      {
         values = ["eq", "before", "after", "between", "exists", "not_exists"];
      }
      else
      {
         values = ["eq", "ne", "in", "contains_any", "contains_all", "not_contains", "exists", "not_exists"];
      }
      return values.map(function(value) { return { value: value, label: value }; });
   }

   function normalizeContract(value)
   {
      value = value && typeof value === "object" ? value : {};
      return {
         version: 1,
         types: copyList(value.types),
         aspects: copyList(value.aspects),
         properties: copyList(value.properties).map(function(rule)
         {
            var result = { name: rule.name, operator: rule.operator, dataType: rule.dataType || "d:text" };
            if (rule.multiValued) { result.multiValued = true; }
            if (rule.operator !== "exists" && rule.operator !== "not_exists") { result.value = rule.value; }
            return result;
         })
      };
   }

   Alfresco.AlfDockiaCommunityShare.MetadataFilters = {
      VERSION: 1,
      operatorsFor: operatorsFor,
      normalizeContract: normalizeContract,
      encode: function(value) { return encodeURIComponent(JSON.stringify(normalizeContract(value))); },
      decode: function(value) { return normalizeContract(JSON.parse(decodeURIComponent(value))); },
      isEmpty: function(value)
      {
         value = normalizeContract(value);
         return !value.types.length && !value.aspects.length && !value.properties.length;
      }
   };
}(this));
