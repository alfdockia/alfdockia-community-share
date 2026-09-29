/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
function getAlfDockiaCommunityShareConfig()
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
      endpointId: configValue(root, "search-endpoint-id", "alfdockia-community-share-search"),
      searchPath: normalizePath(configValue(root, "search-path", "/search")),
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

function normalizePath(value)
{
   value = value || "/search";
   return value.charAt(0) === "/" ? value : "/" + value;
}

function firstArg()
{
   var i, value;
   for (i = 0; i < arguments.length; i++)
   {
      value = args[arguments[i]];
      if (value !== null && String(value).replace(/^\s+|\s+$/g, "").length > 0)
      {
         return String(value).replace(/^\s+|\s+$/g, "");
      }
   }
   return "";
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

function currentUserIsAdmin()
{
   if (user.isAdmin === true)
   {
      return true;
   }
   return !!(user.capabilities && booleanValue(user.capabilities["isAdmin"], false));
}

function currentAuthorities()
{
   var values = [],
      groups = user.properties ? user.properties["alfUserGroups"] : null,
      i,
      splitGroups;

   addAuthority(values, user.name);
   addAuthority(values, "GROUP_EVERYONE");

   if (groups !== null && groups !== undefined)
   {
      splitGroups = String(groups).split(",");
      for (i = 0; i < splitGroups.length; i++)
      {
         addAuthority(values, splitGroups[i]);
      }
   }

   addProcessedUserDataGroups(values);
   addRepositoryUserGroups(values);
   addRepositoryPublicUserGroups(values);
   addRepositorySiteGroups(values);
   addRepositoryPublicSiteGroups(values);

   if (currentUserIsAdmin())
   {
      addAuthority(values, "ROLE_ADMINISTRATOR");
      addAuthority(values, "ALFRESCO_ADMINISTRATORS");
      addAuthority(values, "GROUP_ALFRESCO_ADMINISTRATORS");
   }

   return values;
}

function currentSearchAuthorities()
{
   var values = [],
      groups = user.properties ? user.properties["alfUserGroups"] : null,
      i,
      splitGroups;

   addAuthority(values, user.name);
   addAuthority(values, "GROUP_EVERYONE");

   if (groups !== null && groups !== undefined)
   {
      splitGroups = String(groups).split(",");
      for (i = 0; i < splitGroups.length; i++)
      {
         addAuthority(values, splitGroups[i]);
      }
   }

   addProcessedUserDataGroups(values);

   if (currentUserIsAdmin())
   {
      addAuthority(values, "ROLE_ADMINISTRATOR");
      addAuthority(values, "ALFRESCO_ADMINISTRATORS");
      addAuthority(values, "GROUP_ALFRESCO_ADMINISTRATORS");
   }

   return values;
}

function addProcessedUserDataGroups(values)
{
   var groups,
      authority;

   try
   {
      if (typeof _processedUserData === "undefined" || _processedUserData === null || !_processedUserData.groups)
      {
         return;
      }

      groups = _processedUserData.groups;
      for (authority in groups)
      {
         if (groups.hasOwnProperty && !groups.hasOwnProperty(authority))
         {
            continue;
         }
         if (groups[authority] === true || groups[authority] === "true" || groups[authority] === 1)
         {
            addAuthority(values, authority);
         }
      }
   }
   catch (ignore)
   {
   }
}

function addRepositoryUserGroups(values)
{
   var data = repositoryJsonGet("/api/people/" + encodePathComponent(user.name) + "?groups=true");
   if (data !== null)
   {
      collectAuthoritiesFromObject(values, data);
      collectAuthoritiesFromObject(values, data.entry);
      collectAuthoritiesFromObject(values, data.person);
   }
}

function addRepositoryPublicUserGroups(values)
{
   var data = repositoryApiJsonGet("/-default-/public/alfresco/versions/1/people/" + encodePathComponent(user.name) + "/groups");
   if (data !== null)
   {
      collectAuthoritiesFromObject(values, data);
      collectAuthoritiesFromObject(values, data.list);
      collectAuthorityValues(values, data.list ? data.list.entries : null);
   }
}

function addRepositorySiteGroups(values)
{
   var data = repositoryJsonGet("/api/people/" + encodePathComponent(user.name) + "/sites");
   if (data !== null)
   {
      collectSiteAuthorities(values, data);
      collectSiteAuthorities(values, data.entry);
      collectSiteAuthorities(values, data.list);
   }
}

function addRepositoryPublicSiteGroups(values)
{
   var data = repositoryApiJsonGet("/-default-/public/alfresco/versions/1/people/" + encodePathComponent(user.name) + "/sites");
   if (data !== null)
   {
      collectSiteAuthorities(values, data);
      collectSiteAuthorities(values, data.list);
   }
}

function repositoryJsonGet(path)
{
   return repositoryJsonGetWithEndpoint("alfresco", path);
}

function repositoryApiJsonGet(path)
{
   return repositoryJsonGetWithEndpoint("alfresco-api", path);
}

function repositoryJsonGetWithEndpoint(endpointId, path)
{
   var connector,
      result,
      code,
      text;

   try
   {
      connector = remote.connect(endpointId);
      if (connector === null || connector === undefined)
      {
         return null;
      }

      result = connector.get(path);
      code = statusCode(result);
      if (code < 200 || code >= 300)
      {
         return null;
      }

      text = responseText(result);
      return parseJson(text);
   }
   catch (ignore)
   {
      return null;
   }
}

function parseJson(text)
{
   try
   {
      return JSON.parse(text);
   }
   catch (ignore)
   {
      return null;
   }
}

function collectAuthoritiesFromObject(values, data)
{
   if (data === null || data === undefined)
   {
      return;
   }

   collectAuthorityValues(values, data.authorities);
   collectAuthorityValues(values, data.authorityIds);
   collectAuthorityValues(values, data.groups);
   collectAuthorityValues(values, data.groupMemberships);
   collectAuthorityValues(values, data.groupMembership);
   collectAuthorityValues(values, data.memberOf);
   collectAuthorityValues(values, data.entries);
}

function collectAuthorityValues(values, value)
{
   var i,
      key;

   if (value === null || value === undefined)
   {
      return;
   }

   if (typeof value === "string")
   {
      addSplitAuthorities(values, value);
      return;
   }

   if (value.length !== undefined && typeof value !== "function")
   {
      for (i = 0; i < value.length; i++)
      {
         collectAuthorityValue(values, value[i]);
      }
      return;
   }

   for (key in value)
   {
      if (value.hasOwnProperty && !value.hasOwnProperty(key))
      {
         continue;
      }
      if (value[key] === true || value[key] === "true" || value[key] === 1)
      {
         addAuthority(values, key);
      }
      else
      {
         collectAuthorityValue(values, value[key]);
      }
   }
}

function collectAuthorityValue(values, value)
{
   if (value === null || value === undefined)
   {
      return;
   }

   if (typeof value === "string")
   {
      addSplitAuthorities(values, value);
      return;
   }

   if (value.entry)
   {
      collectAuthorityValue(values, value.entry);
      return;
   }

   addAuthority(values, value.authorityId);
   addAuthority(values, value.fullName);
   addAuthority(values, value.itemName);
   addAuthority(values, value.groupName);
   addAuthority(values, value.id);
   addPrefixedGroupAuthority(values, value.shortName);
   addPrefixedGroupAuthority(values, value.name);
}

function addSplitAuthorities(values, text)
{
   var split = String(text).split(/[;,]/),
      i;

   for (i = 0; i < split.length; i++)
   {
      addAuthority(values, split[i]);
   }
}

function addPrefixedGroupAuthority(values, value)
{
   var text = value !== null && value !== undefined ? String(value).replace(/^\s+|\s+$/g, "") : "";
   if (text.length === 0)
   {
      return;
   }
   addAuthority(values, text);
   if (text.indexOf("GROUP_") !== 0)
   {
      addAuthority(values, "GROUP_" + text);
   }
}

function collectSiteAuthorities(values, data)
{
   var entries,
      i;

   if (data === null || data === undefined)
   {
      return;
   }

   entries = data.entries || data.sites || data.siteMemberships || data.items;
   if (data.list && data.list.entries)
   {
      entries = data.list.entries;
   }

   if (entries && entries.length !== undefined)
   {
      for (i = 0; i < entries.length; i++)
      {
         collectSiteAuthority(values, entries[i].entry || entries[i]);
      }
      return;
   }

   collectSiteAuthority(values, data);
}

function collectSiteAuthority(values, site)
{
   var shortName,
      role,
      managers,
      i;

   if (site === null || site === undefined)
   {
      return;
   }

   if (site.entry)
   {
      site = site.entry;
   }

   shortName = site.shortName || site.siteShortName || site.id || site.name;
   role = site.siteRole || site.role || site.membershipRole;

   if (site.site)
   {
      shortName = site.site.shortName || site.site.siteShortName || site.site.id || shortName;
      role = site.role || site.site.role || role;
   }

   if (!role && site.siteManagers && site.siteManagers.length !== undefined)
   {
      managers = site.siteManagers;
      for (i = 0; i < managers.length; i++)
      {
         if (String(managers[i]).toLowerCase() === String(user.name).toLowerCase())
         {
            role = "SiteManager";
            break;
         }
      }
   }

   if (shortName && role)
   {
      addAuthority(values, "GROUP_site_" + shortName + "_" + role);
   }
}

function encodePathComponent(value)
{
   if (typeof encodeURIComponent === "function")
   {
      return encodeURIComponent(String(value));
   }
   return String(value);
}

function addAuthority(values, value)
{
   var i;
   value = value !== null && value !== undefined ? String(value).replace(/^\s+|\s+$/g, "") : "";
   if (value.length === 0)
   {
      return;
   }
   for (i = 0; i < values.length; i++)
   {
      if (values[i] === value)
      {
         return;
      }
   }
   values.push(value);
}

function searchFilters()
{
   var filters = {},
      facetFilters = firstArg("filters", "facetFilters", "encodedFilters"),
      names = [
         "site",
         "nodeType",
         "type",
         "parentId",
         "primaryParent",
         "ancestorId",
         "mimeType",
         "contentMimeType",
         "aclId",
         "createdFrom",
         "createdTo",
         "modifiedFrom",
         "modifiedTo"
      ],
      i,
      value;

   for (i = 0; i < names.length; i++)
   {
      value = args[names[i]];
      if (value !== null && value !== undefined && String(value).length > 0)
      {
         filters[names[i]] = String(value);
      }
   }

   if (facetFilters.length > 0)
   {
      filters.facetFilters = facetFilters;
   }

   return filters;
}

function metadataFilters()
{
   var value = firstArg("metadataFilters"), parsed;
   if (!value) { return null; }
   try { parsed = JSON.parse(value); }
   catch (error) { throw new Error("Los filtros de metadatos no son JSON valido."); }
   if (!parsed || typeof parsed !== "object") { throw new Error("Los filtros de metadatos no son validos."); }
   return parsed;
}

function statusCode(result)
{
   if (!result || result.status === null || result.status === undefined)
   {
      return 500;
   }
   if (typeof result.status === "number")
   {
      return result.status;
   }
   if (result.status.code !== null && result.status.code !== undefined)
   {
      return integerValue(result.status.code, 500, 100, 599);
   }
   return integerValue(result.status, 500, 100, 599);
}

function responseText(result)
{
   if (result && result.response !== null && result.response !== undefined)
   {
      return String(result.response);
   }
   return result !== null && result !== undefined ? String(result) : "";
}

function errorResponse(code, message, queryText, skipCount, maxItems)
{
   status.code = code;
   status.message = message;
   model.json = jsonUtils.toJSONString(
   {
      error:
      {
         statusCode: code,
         briefSummary: message
      },
      list:
      {
         pagination:
         {
            count: 0,
            hasMoreItems: false,
            totalItems: 0,
            skipCount: skipCount,
            maxItems: maxItems
         },
         context:
         {
            query:
            {
               language: "alfdockia-community-share",
               userQuery: queryText
            }
         },
         entries: []
      }
   });
}

function main()
{
   var alfdockiaCommunityShare = getAlfDockiaCommunityShareConfig(),
      queryText = firstArg("q", "query", "term"),
      skipCount = integerValue(firstArg("skipCount", "startIndex"), 0, 0, null),
      requestedMaxItems = firstArg("maxItems", "maxResults", "pageSize"),
      maxItems = integerValue(requestedMaxItems, alfdockiaCommunityShare.defaultMaxItems, 1, alfdockiaCommunityShare.maxItemsLimit),
      mode = firstArg("mode") === "bulk" ? "bulk" : "interactive",
      cursor = firstArg("cursor"),
      includeTotal = booleanValue(firstArg("includeTotal"), false),
      authorities = currentSearchAuthorities(),
      payload,
      connector,
      result,
      code,
      body;

   if (!alfdockiaCommunityShare.enabled)
   {
      errorResponse(503, "AlfDockia IA search is disabled in Share configuration", queryText, skipCount, maxItems);
      return;
   }

   if (queryText.length === 0)
   {
      errorResponse(400, "Parameter 'q' or 'query' is required", queryText, skipCount, maxItems);
      return;
   }

   connector = remote.connect(alfdockiaCommunityShare.endpointId);
   if (connector === null || connector === undefined)
   {
      errorResponse(502, "AlfDockia IA endpoint '" + alfdockiaCommunityShare.endpointId + "' is not configured", queryText, skipCount, maxItems);
      return;
   }

   payload =
   {
      query:
      {
         language: "alfdockia-community-share",
         query: queryText
      },
      mode: mode,
      paging:
      {
         skipCount: cursor ? 0 : skipCount,
         maxItems: maxItems,
         cursor: cursor || null,
         includeTotal: includeTotal
      },
      user: user.name,
      authorities: authorities,
      isAdmin: currentUserIsAdmin(),
      permissions:
      {
         user: user.name,
         authorities: authorities,
         isAdmin: currentUserIsAdmin()
      },
      filters: searchFilters()
   };
   try
   {
      var metadata = metadataFilters();
      if (metadata !== null) { payload.filters.metadata = metadata; }
   }
   catch (filterError)
   {
      errorResponse(400, filterError.message, queryText, skipCount, maxItems);
      return;
   }

   body = jsonUtils.toJSONString(payload);
   try
   {
      result = connector.post(alfdockiaCommunityShare.searchPath, body, "application/json");
   }
   catch (e)
   {
      errorResponse(502, "AlfDockia IA search service is not reachable: " + e.message, queryText, skipCount, maxItems);
      return;
   }

   code = statusCode(result);

   if (code >= 200 && code < 300)
   {
      model.json = responseText(result);
   }
   else
   {
      errorResponse(code, responseText(result) || "AlfDockia IA search service returned HTTP " + code, queryText, skipCount, maxItems);
   }
}

main();
