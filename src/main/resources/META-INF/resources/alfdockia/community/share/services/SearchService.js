/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Search service bridge for AlfDockia semantic searches in the standard Share
 * faceted results page.
 */
define(["dojo/_base/declare",
        "alfresco/services/SearchService",
        "alfresco/core/topics",
        "dojo/json"],
        function(declare, SearchService, topics, dojoJson) {

   return declare([SearchService], {

      /**
       * Share webscript used as a secure proxy to the Python semantic search
       * service. Non AlfDockia searches are delegated to the original Aikau
       * SearchService.
       */
      alfdockiaCommunityShareAPI: null,

      /**
       * Intercepts only advanced-search requests marked as AlfDockia semantic
       * searches.
       */
      onSearchRequest: function alfdockia_community_share_services_SearchService__onSearchRequest(payload) {
         var aiPayload = this._alfdockiaCommunitySharePayload(payload);

         if (!aiPayload)
         {
            return this.inherited(arguments);
         }

         this._onAlfDockiaCommunityShareRequest(payload || {}, aiPayload);
      },

      _onAlfDockiaCommunityShareRequest: function alfdockia_community_share_services_SearchService___onAlfDockiaCommunityShareRequest(payload, aiPayload) {
         var alfTopic = payload.alfResponseTopic ? payload.alfResponseTopic : topics.SEARCH_REQUEST,
            queryText = payload.term || aiPayload.term || aiPayload.alfdockiaCommunityShareQuery || "",
            pageSize = this._alfdockiaCommunityShareNumber(aiPayload.alfdockiaCommunityShareMaxItems, this._alfdockiaCommunityShareNumber(payload.pageSize, this.pageSize)),
            startIndex = this._alfdockiaCommunityShareNumber((payload.startIndex || payload.startIndex === 0) ? payload.startIndex : aiPayload.startIndex, this.startIndex),
            mode = aiPayload.alfdockiaCommunityShareMode === "bulk" ? "bulk" : "interactive",
            cursor = aiPayload.alfdockiaCommunityShareCursor || payload.alfdockiaCommunityShareCursor || "",
            cursorStateKey = queryText + "|" + mode + "|" + dojoJson.stringify(aiPayload.alfdockiaCommunityShareFilters || {}),
            requestConfig;

         if (!this._alfdockiaCommunityShareCursorState || this._alfdockiaCommunityShareCursorState.key !== cursorStateKey)
         {
            this._alfdockiaCommunityShareCursorState = { key: cursorStateKey, byIndex: { 0: "" } };
         }
         if (!cursor && startIndex > 0 && this._alfdockiaCommunityShareCursorState.byIndex[startIndex])
         {
            cursor = this._alfdockiaCommunityShareCursorState.byIndex[startIndex];
         }

         if (!queryText)
         {
            this.alfPublish(alfTopic + "_FAILURE",
            {
               requestConfig: {},
               response: { message: "No se ha indicado consulta IA." }
            }, false, false, payload.alfResponseScope);
            return;
         }

         requestConfig =
         {
            requestId: payload.requestId,
            alfTopic: alfTopic,
            alfResponseScope: payload.alfResponseScope,
            alfdockiaCommunityShareCursorStateKey: cursorStateKey,
            alfdockiaCommunityShareStartIndex: startIndex,
            url: this._alfdockiaCommunityShareUrl(),
            query:
            {
               query: queryText,
               q: queryText,
               term: queryText,
               skipCount: cursor ? 0 : startIndex,
               maxItems: pageSize,
               maxResults: pageSize,
               pageSize: pageSize,
               site: payload.site || aiPayload.site || "",
               filters: payload.filters || "",
               facetFilters: payload.facetFilters || payload.filters || "",
               encodedFilters: payload.filters || "",
               facetFields: payload.facetFields || "",
               metadataFilters: aiPayload.alfdockiaCommunityShareFilters ? dojoJson.stringify(aiPayload.alfdockiaCommunityShareFilters) : "",
               mode: mode,
               cursor: cursor,
               includeTotal: aiPayload.alfdockiaCommunityShareIncludeTotal === true,
               noCache: new Date().getTime()
            },
            method: "GET",
            callbackScope: this,
            successCallback: this._onAlfDockiaCommunityShareSuccess,
            failureCallback: this._onAlfDockiaCommunityShareFailure
         };

         this.serviceXhr(requestConfig);
      },

      _alfdockiaCommunitySharePayload: function alfdockia_community_share_services_SearchService___alfdockiaCommunitySharePayload(payload) {
         var queryData;

         if (!payload)
         {
            return null;
         }

         if (this._isAlfDockiaCommunityShareRequest(payload))
         {
            return payload;
         }

         queryData = this._alfdockiaCommunityShareQueryData(payload.query);
         return this._isAlfDockiaCommunityShareRequest(queryData) ? queryData : null;
      },

      _alfdockiaCommunityShareQueryData: function alfdockia_community_share_services_SearchService___alfdockiaCommunityShareQueryData(query) {
         var decoded;

         if (!query)
         {
            return null;
         }
         if (typeof query === "object")
         {
            return query;
         }
         if (typeof query !== "string")
         {
            return null;
         }

         decoded = query;
         try
         {
            if (decoded.indexOf("%7B") === 0 || decoded.indexOf("%7b") === 0)
            {
               decoded = decodeURIComponent(decoded);
            }
            return dojoJson.parse(decoded);
         }
         catch (ignore)
         {
            return null;
         }
      },

      _isAlfDockiaCommunityShareRequest: function alfdockia_community_share_services_SearchService___isAlfDockiaCommunityShareRequest(payload) {
         return payload && (payload.alfdockiaCommunityShareSearch === true || payload.alfdockiaCommunityShareSearch === "true");
      },

      _alfdockiaCommunityShareUrl: function alfdockia_community_share_services_SearchService___alfdockiaCommunityShareUrl() {
         if (this.alfdockiaCommunityShareAPI)
         {
            return this.alfdockiaCommunityShareAPI;
         }
         if (typeof Alfresco !== "undefined" && Alfresco.constants && Alfresco.constants.URL_SERVICECONTEXT)
         {
            return Alfresco.constants.URL_SERVICECONTEXT + "alfdockia-community-share/search";
         }
         return "/share/service/alfdockia-community-share/search";
      },

      _onAlfDockiaCommunityShareSuccess: function alfdockia_community_share_services_SearchService___onAlfDockiaCommunityShareSuccess(response, requestConfig) {
         var pagination = response && response.list && response.list.pagination ? response.list.pagination : {},
            count = this._alfdockiaCommunityShareNumber(pagination.count, 0),
            nextIndex = this._alfdockiaCommunityShareNumber(requestConfig.alfdockiaCommunityShareStartIndex, 0) + count;
         if (pagination.cursor && this._alfdockiaCommunityShareCursorState &&
             this._alfdockiaCommunityShareCursorState.key === requestConfig.alfdockiaCommunityShareCursorStateKey)
         {
            this._alfdockiaCommunityShareCursorState.byIndex[nextIndex] = pagination.cursor;
         }
         requestConfig.query.alfdockiaCommunityShareDisplayStartIndex = requestConfig.alfdockiaCommunityShareStartIndex;
         this.alfPublish(requestConfig.alfTopic + "_SUCCESS",
         {
            requestConfig: requestConfig,
            response: this._toShareSearchResponse(response, requestConfig.query)
         }, false, false, requestConfig.alfResponseScope);
      },

      _onAlfDockiaCommunityShareFailure: function alfdockia_community_share_services_SearchService___onAlfDockiaCommunityShareFailure(response, requestConfig) {
         this.alfPublish(requestConfig.alfTopic + "_FAILURE",
         {
            requestConfig: requestConfig,
            response: response
         }, false, false, requestConfig.alfResponseScope);
      },

      _toShareSearchResponse: function alfdockia_community_share_services_SearchService___toShareSearchResponse(response, requestQuery) {
         var list = response && response.list ? response.list : {},
            pagination = list.pagination || {},
            entries = list.entries || (response && response.items) || (response && response.results) || [],
            mappedItems = [],
            items = [],
            facets,
            totalItems,
            displayStart = this._alfdockiaCommunityShareNumber(requestQuery && requestQuery.alfdockiaCommunityShareDisplayStartIndex,
               this._alfdockiaCommunityShareNumber(pagination.skipCount, this._alfdockiaCommunityShareNumber(requestQuery && requestQuery.skipCount, 0))),
            hasFilters = !!(requestQuery && requestQuery.filters && String(requestQuery.filters).length > 0),
            i,
            item;

         for (i = 0; i < entries.length; i++)
         {
            item = this._toShareSearchItem(entries[i]);
            if (item.nodeRef)
            {
               mappedItems.push(item);
            }
         }

         items = this._filterItemsByFacets(mappedItems, requestQuery && requestQuery.filters);
         facets = this._normalisedFacets(response && response.facets);
         if (this._isEmptyObject(facets))
         {
            facets = this._buildFacets(items, requestQuery && requestQuery.facetFields);
         }

         if (hasFilters)
         {
            totalItems = items.length;
         }
         else
         {
            totalItems = this._alfdockiaCommunityShareNumber(pagination.totalItems, null);
            if (totalItems === null)
            {
               totalItems = this._alfdockiaCommunityShareNumber(response && response.numberFound, null);
            }
            if (totalItems === null)
            {
               totalItems = displayStart + items.length + (pagination.hasMoreItems ? 1 : 0);
            }
         }

         return (
         {
            numberFound: totalItems,
            startIndex: displayStart,
            items: items,
            facets: facets,
            totalItemsExact: pagination.totalItemsExact === true,
            cursor: pagination.cursor || null,
            spellcheck: response && response.spellcheck ? response.spellcheck : {}
         });
      },

      _normalisedFacets: function alfdockia_community_share_services_SearchService___normalisedFacets(facets) {
         return facets && typeof facets === "object" ? facets : {};
      },

      _isEmptyObject: function alfdockia_community_share_services_SearchService___isEmptyObject(value) {
         var key;
         if (!value)
         {
            return true;
         }
         for (key in value)
         {
            if (value.hasOwnProperty(key))
            {
               return false;
            }
         }
         return true;
      },

      _buildFacets: function alfdockia_community_share_services_SearchService___buildFacets(items, facetFields) {
         var fields = this._requestedFacetFields(facetFields),
            facets = {},
            i,
            j,
            k,
            qname,
            buckets,
            values;

         for (i = 0; i < fields.length; i++)
         {
            qname = fields[i];
            buckets = {};
            for (j = 0; j < items.length; j++)
            {
               values = this._facetValues(items[j], qname);
               for (k = 0; k < values.length; k++)
               {
                  this._addFacetBucket(buckets, values[k]);
               }
            }
            if (!this._isEmptyObject(buckets))
            {
               facets[qname] = buckets;
            }
         }

         return facets;
      },

      _requestedFacetFields: function alfdockia_community_share_services_SearchService___requestedFacetFields(facetFields) {
         var defaults = [
               "cm:creator",
               "cm:modifier",
               "mimetype",
               "content.mimetype",
               "cm:content.mimetype",
               "cm:created",
               "cm:modified",
               "size",
               "content.size",
               "cm:content.size"
            ],
            fields = [],
            seen = {},
            raw = [],
            i,
            qname;

         if (facetFields && typeof facetFields === "string")
         {
            raw = facetFields.split(",");
         }
         else if (facetFields && facetFields.length !== undefined)
         {
            raw = facetFields;
         }
         if (raw.length === 0)
         {
            raw = [];
         }
         for (i = 0; i < defaults.length; i++)
         {
            raw.push(defaults[i]);
         }

         for (i = 0; i < raw.length; i++)
         {
            qname = String(raw[i] || "").replace(/^\s+|\s+$/g, "");
            if (qname.length > 0 && !seen[qname])
            {
               fields.push(qname);
               seen[qname] = true;
            }
         }

         return fields;
      },

      _addFacetBucket: function alfdockia_community_share_services_SearchService___addFacetBucket(buckets, facetValue) {
         var value = facetValue && facetValue.value !== null && facetValue.value !== undefined ? String(facetValue.value) : "",
            label = facetValue && facetValue.label ? String(facetValue.label) : value;

         if (value.length === 0)
         {
            return;
         }
         if (!buckets[value])
         {
            buckets[value] =
            {
               label: label,
               value: value,
               hits: 0,
               index: facetValue && facetValue.index !== undefined ? facetValue.index : undefined
            };
         }
         buckets[value].hits++;
      },

      _filterItemsByFacets: function alfdockia_community_share_services_SearchService___filterItemsByFacets(items, filters) {
         var parsedFilters = this._parseFacetFilters(filters),
            filtered = [],
            i,
            j,
            matches;

         if (parsedFilters.length === 0)
         {
            return items;
         }

         for (i = 0; i < items.length; i++)
         {
            matches = true;
            for (j = 0; j < parsedFilters.length; j++)
            {
               if (!this._itemMatchesFacet(items[i], parsedFilters[j]))
               {
                  matches = false;
                  break;
               }
            }
            if (matches)
            {
               filtered.push(items[i]);
            }
         }

         return filtered;
      },

      _parseFacetFilters: function alfdockia_community_share_services_SearchService___parseFacetFilters(filters) {
         var parsed = [],
            parts,
            i,
            filter,
            separator;

         if (!filters)
         {
            return parsed;
         }

         parts = String(filters).split(",");
         for (i = 0; i < parts.length; i++)
         {
            filter = this._decodeFilterValue(parts[i]);
            separator = filter.indexOf("|");
            if (separator > 0)
            {
               parsed.push(
               {
                  qname: filter.substring(0, separator),
                  value: filter.substring(separator + 1)
               });
            }
         }
         return parsed;
      },

      _decodeFilterValue: function alfdockia_community_share_services_SearchService___decodeFilterValue(value) {
         try
         {
            return decodeURIComponent(String(value || ""));
         }
         catch (ignore)
         {
            return String(value || "");
         }
      },

      _itemMatchesFacet: function alfdockia_community_share_services_SearchService___itemMatchesFacet(item, filter) {
         var values = this._facetValues(item, filter.qname),
            i;

         for (i = 0; i < values.length; i++)
         {
            if (String(values[i].value) === String(filter.value) || String(values[i].label) === String(filter.value))
            {
               return true;
            }
         }
         return false;
      },

      _facetValues: function alfdockia_community_share_services_SearchService___facetValues(item, qname) {
         var key = this._facetKey(qname),
            value,
            label;

         if (key.indexOf("creator") !== -1)
         {
            value = item.createdByUser || item.createdBy;
            label = item.createdBy || value;
            return value ? [{ value: value, label: label }] : [];
         }
         if (key.indexOf("modifier") !== -1)
         {
            value = item.modifiedByUser || item.modifiedBy;
            label = item.modifiedBy || value;
            return value ? [{ value: value, label: label }] : [];
         }
         if (key.indexOf("mimetype") !== -1 || key.indexOf("mime") !== -1)
         {
            value = item.mimetype || "";
            return value ? [{ value: value, label: this._mimeLabel(value) }] : [];
         }
         if (key.indexOf("created") !== -1)
         {
            return this._dateFacetValues(item.createdOn);
         }
         if (key.indexOf("modified") !== -1)
         {
            return this._dateFacetValues(item.modifiedOn);
         }
         if (key.indexOf("size") !== -1)
         {
            return this._sizeFacetValues(item.size);
         }
         if (key.indexOf("type") !== -1)
         {
            value = item.type || "";
            return value ? [{ value: value, label: value === "folder" ? "Carpeta" : "Documento" }] : [];
         }

         return [];
      },

      _facetKey: function alfdockia_community_share_services_SearchService___facetKey(qname) {
         return String(qname || "")
            .replace(/^@/, "")
            .replace(/\.__.u/g, "")
            .replace(/\.__/g, "")
            .toLowerCase();
      },

      _dateFacetValues: function alfdockia_community_share_services_SearchService___dateFacetValues(dateValue) {
         var date = this._dateValue(dateValue),
            now = new Date(),
            weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)),
            monthStart = new Date(now.getFullYear(), now.getMonth(), 1),
            sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1),
            yearStart = new Date(now.getFullYear(), 0, 1),
            values = [];

         if (!date)
         {
            return values;
         }

         if (date >= weekStart)
         {
            values.push({ value: "LAST_7_DAYS", label: "Esta semana", index: 0 });
         }
         if (date >= monthStart)
         {
            values.push({ value: "THIS_MONTH", label: "Este mes", index: 1 });
         }
         if (date >= sixMonthsStart)
         {
            values.push({ value: "LAST_6_MONTHS", label: "En los ultimos 6 meses", index: 2 });
         }
         if (date >= yearStart)
         {
            values.push({ value: "THIS_YEAR", label: "Este a\u00f1o", index: 3 });
         }

         return values;
      },

      _sizeFacetValues: function alfdockia_community_share_services_SearchService___sizeFacetValues(sizeValue) {
         var size = this._alfdockiaCommunityShareNumber(sizeValue, -1);

         if (size < 0)
         {
            return [];
         }
         if (size < 1048576)
         {
            return [{ value: "0-1048576", label: "0 a 1 MB", index: 0 }];
         }
         if (size < 16777216)
         {
            return [{ value: "1048576-16777216", label: "1 a 16 MB", index: 1 }];
         }
         if (size < 134217728)
         {
            return [{ value: "16777216-134217728", label: "16 a 128 MB", index: 2 }];
         }
         return [{ value: "134217728-", label: "Mas de 128 MB", index: 3 }];
      },

      _dateValue: function alfdockia_community_share_services_SearchService___dateValue(dateValue) {
         var value = String(dateValue || "").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"),
            time;

         if (value.length === 0)
         {
            return null;
         }
         time = Date.parse(value);
         return isNaN(time) ? null : new Date(time);
      },

      _mimeLabel: function alfdockia_community_share_services_SearchService___mimeLabel(mimetype) {
         var labels =
         {
            "application/pdf": "Adobe PDF Document",
            "text/plain": "Plain Text",
            "text/html": "HTML Document",
            "application/msword": "Microsoft Word Document",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Microsoft Word Document",
            "application/vnd.ms-excel": "Microsoft Excel Spreadsheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Microsoft Excel Spreadsheet",
            "application/vnd.ms-powerpoint": "Microsoft PowerPoint Presentation",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": "Microsoft PowerPoint Presentation"
         };
         return labels[mimetype] || mimetype;
      },

      _toShareSearchItem: function alfdockia_community_share_services_SearchService___toShareSearchItem(wrapper) {
         var entry = wrapper && wrapper.entry ? wrapper.entry : (wrapper || {}),
            properties = entry.properties || {},
            content = entry.content || {},
            nodeRef = this._entryNodeRef(entry),
            name = entry.name || properties["cm:name"] || entry.title || entry.id || nodeRef,
            modifiedByUser = entry.modifiedByUser || {},
            createdByUser = entry.createdByUser || {},
            modifiedOn = entry.modifiedOn || entry.modifiedAt || entry.modified || properties["cm:modified"] || "",
            score = entry.search && entry.search.score ? entry.search.score : entry.score;

         return (
         {
            nodeRef: nodeRef,
            name: name,
            displayName: entry.displayName || name,
            title: entry.title || properties["cm:title"] || "",
            description: entry.description || properties["cm:description"] || entry.textPreview || entry.summary || "",
            type: this._entryType(entry.type || entry.nodeType),
            mimetype: content.mimeType || content.mimetype || entry.mimeType || entry.mimetype || properties["cm:content.mimetype"] || "",
            size: this._entrySize(entry, content, properties),
            path: this._entryPath(entry),
            modifiedOn: modifiedOn,
            modifiedBy: this._userDisplayName(modifiedByUser, entry.modifiedBy || properties["cm:modifier"] || ""),
            modifiedByUser: this._userId(modifiedByUser, entry.modifiedBy || properties["cm:modifier"] || ""),
            createdOn: entry.createdOn || entry.createdAt || entry.created || properties["cm:created"] || "",
            createdBy: this._userDisplayName(createdByUser, entry.createdBy || properties["cm:creator"] || ""),
            createdByUser: this._userId(createdByUser, entry.createdBy || properties["cm:creator"] || ""),
            site: this._entrySite(entry),
            lastThumbnailModification: entry.lastThumbnailModification || modifiedOn,
            allowableOperations: entry.allowableOperations || [],
            permissions: entry.permissions || {},
            search:
            {
               score: score,
               type: "alfdockia-community-share"
            },
            highlighting: entry.highlighting || {}
         });
      },

      _entryNodeRef: function alfdockia_community_share_services_SearchService___entryNodeRef(entry) {
         if (entry.nodeRef)
         {
            return entry.nodeRef;
         }
         if (entry.id)
         {
            return String(entry.id).indexOf("://") === -1 ? "workspace://SpacesStore/" + entry.id : entry.id;
         }
         return "";
      },

      _entryType: function alfdockia_community_share_services_SearchService___entryType(type) {
         type = String(type || "").toLowerCase();
         if (type === "folder" || type === "cm:folder" || type.indexOf("folder") !== -1)
         {
            return "folder";
         }
         return "document";
      },

      _entryPath: function alfdockia_community_share_services_SearchService___entryPath(entry) {
         var path = entry.path || entry.qnamePath || "";
         if (path && typeof path === "object")
         {
            path = path.name || path.displayPath || path.path || "";
         }
         path = String(path || "");
         return path.length > 0 && path.charAt(0) !== "/" ? "/" + path : path;
      },

      _entrySite: function alfdockia_community_share_services_SearchService___entrySite(entry) {
         var site = entry.site || entry.siteInfo || null;
         if (!site)
         {
            return null;
         }
         if (typeof site === "string")
         {
            return { shortName: site, title: site };
         }
         return site;
      },

      _entrySize: function alfdockia_community_share_services_SearchService___entrySize(entry, content, properties) {
         var contentProperty = properties["cm:content"] || properties.content || {},
            size = entry.size ||
               entry.sizeInBytes ||
               content.size ||
               content.sizeInBytes ||
               properties["cm:content.size"] ||
               properties["content.size"] ||
               contentProperty.size ||
               contentProperty.sizeInBytes ||
               -1;
         return this._alfdockiaCommunityShareNumber(size, -1);
      },

      _userDisplayName: function alfdockia_community_share_services_SearchService___userDisplayName(userInfo, fallback) {
         if (userInfo && userInfo.displayName)
         {
            return userInfo.displayName;
         }
         if (userInfo && userInfo.id)
         {
            return userInfo.id;
         }
         return fallback || "";
      },

      _userId: function alfdockia_community_share_services_SearchService___userId(userInfo, fallback) {
         if (userInfo && userInfo.id)
         {
            return userInfo.id;
         }
         return fallback || "";
      },

      _alfdockiaCommunityShareNumber: function alfdockia_community_share_services_SearchService___alfdockiaCommunityShareNumber(value, fallback) {
         var number = parseInt(value, 10);
         return isNaN(number) ? fallback : number;
      }
   });
});
