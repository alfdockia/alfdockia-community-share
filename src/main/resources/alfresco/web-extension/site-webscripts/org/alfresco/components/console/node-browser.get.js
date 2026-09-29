/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
function alfdockiaCommunityShareConfig()
{
   var scoped = null,
      root = null;

   try
   {
      scoped = config.scoped["AlfDockiaCommunityShare"];
      if (scoped !== null)
      {
         root = scoped["alfdockia-community-share"];
      }
   }
   catch (ignore)
   {
      root = null;
   }

   return (
   {
      enabled: booleanValue(configValue(root, "enabled", "true"), true),
      language: configValue(root, "language", "IA-Search"),
      defaultMaxItems: integerValue(configValue(root, "default-max-items", "25"), 25, 1, 1000),
      maxItemsLimit: integerValue(configValue(root, "max-items-limit", "100"), 100, 1, 1000)
   });
}

function configValue(root, name, fallback)
{
   var value = null;
   if (root !== null && root.getChildValue)
   {
      value = root.getChildValue(name);
   }
   return value !== null && String(value).length > 0 ? String(value) : fallback;
}

function integerValue(value, fallback, min, max)
{
   var number = parseInt(value, 10);
   if (isNaN(number))
   {
      number = fallback;
   }
   if (typeof min === "number")
   {
      number = Math.max(min, number);
   }
   if (typeof max === "number")
   {
      number = Math.min(max, number);
   }
   return number;
}

function booleanValue(value, fallback)
{
   if (value === null || value === undefined || String(value).length === 0)
   {
      return fallback;
   }
   value = String(value).toLowerCase();
   return value === "true" || value === "1" || value === "yes" || value === "on";
}

function main()
{
   var widget =
   {
      id: "ConsoleNodeBrowser",
      name: "Alfresco.ConsoleNodeBrowser"
   };

   model.alfdockiaCommunityShare = alfdockiaCommunityShareConfig();
   model.widgets = [widget];
}

main();
