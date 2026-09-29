/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Advanced Search component GET method with AlfDockia IA extensions.
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
   // fetch the request params required by the advanced search component template
   var siteId = (page.url.templateArgs["site"] != null) ? page.url.templateArgs["site"] : "";

   // get the search forms from the config
   var formsElements = config.scoped["AdvancedSearch"]["advanced-search"].getChildren("forms");
   var searchForms = [];

   for (var x = 0, forms; x < formsElements.size(); x++)
   {
      forms = formsElements.get(x).childrenMap["form"];

      for (var i = 0, form, formId, label, desc; i < forms.size(); i++)
      {
         form = forms.get(i);

         // get optional attributes and resolve label/description text
         formId = form.attributes["id"];

         label = form.attributes["label"];
         if (label == null)
         {
            label = form.attributes["labelId"];
            if (label != null)
            {
               label = msg.get(label);
            }
         }

         desc = form.attributes["description"];
         if (desc == null)
         {
            desc = form.attributes["descriptionId"];
            if (desc != null)
            {
               desc = msg.get(desc);
            }
         }

         // create the model object to represent the form definition
         searchForms.push(
         {
            id: formId ? formId : "search",
            type: form.value,
            label: label ? label : form.value,
            description: desc ? desc : ""
         });
      }
   }

   // Prepare the model
   model.searchScope = siteId || "all_sites";
   model.siteId = siteId;
   model.searchForms = searchForms;
   model.searchPath = "{site}dp/ws/faceted-search#searchTerm={terms}&query={query}&scope={scope}";
   model.alfdockiaCommunityShare = alfdockiaCommunityShareConfig();

   // Widget instantiation metadata...
   var advancedSearch = {
      id : "AdvancedSearch",
      name : "Alfresco.AdvancedSearch",
      options : {
         siteId : model.siteId,
         savedQuery : (page.url.args.sq != null) ? page.url.args.sq : "",
         searchScope : model.searchScope,
         searchForms : model.searchForms,
         searchPath : model.searchPath,
         alfdockiaCommunityShare : model.alfdockiaCommunityShare
      }
   };
   model.widgets = [advancedSearch];
}

main();
