/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Adds AlfDockia IA semantic search as a query language for the Alfresco Share
 * Node Browser.
 */
(function()
{
   if (typeof Alfresco === "undefined" || !Alfresco.ConsoleNodeBrowser)
   {
      return;
   }

   if (Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareSharePatched)
   {
      return;
   }

   var originalOnReady = Alfresco.ConsoleNodeBrowser.prototype.onReady,
      originalOnHistoryManagerReady = Alfresco.ConsoleNodeBrowser.prototype.onHistoryManagerReady;

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareSharePatched = true;

   Alfresco.ConsoleNodeBrowser.prototype.onReady = function AlfDockiaCommunityShareShare_onReady()
   {
      originalOnReady.apply(this, arguments);
      this._installAlfDockiaCommunityShareRoute();
   };

   Alfresco.ConsoleNodeBrowser.prototype.onHistoryManagerReady = function AlfDockiaCommunityShareShare_onHistoryManagerReady()
   {
      var result = originalOnHistoryManagerReady.apply(this, arguments);
      this._installAlfDockiaCommunityShareRoute();
      return result;
   };

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareConfig = function AlfDockiaCommunityShareShare_config()
   {
      var config = Alfresco.AlfDockiaCommunityShare && Alfresco.AlfDockiaCommunityShare.NodeBrowser ? Alfresco.AlfDockiaCommunityShare.NodeBrowser : {};
      return (
      {
         enabled: config.enabled !== false,
         language: config.language || "IA-Search",
         searchUrl: config.searchUrl || Alfresco.constants.URL_SERVICECONTEXT + "alfdockia-community-share/search",
         defaultMaxItems: this._alfdockiaCommunityShareNumber(config.defaultMaxItems, 25),
         maxItemsLimit: this._alfdockiaCommunityShareNumber(config.maxItemsLimit, 100)
      });
   };

   Alfresco.ConsoleNodeBrowser.prototype._installAlfDockiaCommunityShareRoute = function AlfDockiaCommunityShareShare_installRoute()
   {
      if (this._alfdockiaCommunityShareRouteInstalled)
      {
         return;
      }

      if (!this.widgets || !this.widgets.dataSource)
      {
         YAHOO.lang.later(50, this, this._installAlfDockiaCommunityShareRoute);
         return;
      }

      this._alfdockiaCommunityShareRouteInstalled = true;

      var nodeBrowser = this,
         dataSource = this.widgets.dataSource,
         originalLiveData = dataSource.liveData,
         originalSendRequest = dataSource.sendRequest,
         originalDoBeforeParseData = dataSource.doBeforeParseData;

      dataSource.sendRequest = function AlfDockiaCommunityShareShare_sendRequest(request, callback, caller)
      {
         var alfdockiaCommunityShare = nodeBrowser._alfdockiaCommunityShareConfig(),
            mode = alfdockiaCommunityShare.enabled ? nodeBrowser._alfdockiaCommunityShareRequestMode(request, alfdockiaCommunityShare) : null;

         if (mode)
         {
            dataSource.liveData = alfdockiaCommunityShare.searchUrl;
            request = nodeBrowser._normalizeAlfDockiaCommunityShareRequest(request, alfdockiaCommunityShare);
         }
         else
         {
            dataSource.liveData = originalLiveData;
         }

         return originalSendRequest.call(dataSource, request, callback, caller);
      };

      dataSource.doBeforeParseData = function AlfDockiaCommunityShareShare_beforeParseData(request, fullResponse)
      {
         var alfdockiaCommunityShare = nodeBrowser._alfdockiaCommunityShareConfig(),
            mode = nodeBrowser._alfdockiaCommunityShareRequestMode(request, alfdockiaCommunityShare);

         if (mode || nodeBrowser._isAlfDockiaCommunityShareResponse(fullResponse))
         {
            fullResponse = nodeBrowser._toNodeBrowserResponse(fullResponse);
         }

         return originalDoBeforeParseData.call(dataSource, request, fullResponse);
      };
   };

   Alfresco.ConsoleNodeBrowser.prototype._isAlfDockiaCommunityShareRequest = function AlfDockiaCommunityShareShare_isIaRequest(request)
   {
      return this._alfdockiaCommunityShareRequestMode(request, this._alfdockiaCommunityShareConfig()) !== null;
   };

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareRequestMode = function AlfDockiaCommunityShareShare_requestMode(request, alfdockiaCommunityShare)
   {
      var lang = this._alfdockiaCommunityShareLanguageKey(this._alfdockiaCommunityShareParameter(request || "", "lang")),
         searchLabel = this._alfdockiaCommunityShareLanguageKey((alfdockiaCommunityShare || {}).language || "IA-Search");

      if (lang === searchLabel || lang === "ia-search" || lang === "ia" || lang === "alfdockia-community-share")
      {
         return "search";
      }
      return null;
   };

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareLanguageKey = function AlfDockiaCommunityShareShare_languageKey(value)
   {
      return String(value || "").toLowerCase().replace(/^\s+|\s+$/g, "").replace(/[\s_]+/g, "-");
   };

   Alfresco.ConsoleNodeBrowser.prototype._isAlfDockiaCommunityShareResponse = function AlfDockiaCommunityShareShare_isIaResponse(response)
   {
      var context = response && response.list && response.list.context,
         language = context && context.query ? context.query.language : "";
      return language === "alfdockia-community-share";
   };

   Alfresco.ConsoleNodeBrowser.prototype._normalizeAlfDockiaCommunityShareRequest = function AlfDockiaCommunityShareShare_normalizeRequest(request, alfdockiaCommunityShare)
   {
      var maxItems = this._alfdockiaCommunityShareParameter(request, "maxItems") ||
            this._alfdockiaCommunityShareParameter(request, "maxResults") ||
            alfdockiaCommunityShare.defaultMaxItems,
         skipCount = this._alfdockiaCommunityShareParameter(request, "skipCount") || "0";

      maxItems = Math.min(this._alfdockiaCommunityShareNumber(maxItems, alfdockiaCommunityShare.defaultMaxItems), alfdockiaCommunityShare.maxItemsLimit);

      if (!/(?:\?|&)maxItems=/.test(request))
      {
         request += "&maxItems=" + encodeURIComponent(maxItems);
      }

      if (!/(?:\?|&)skipCount=/.test(request))
      {
         request += "&skipCount=" + encodeURIComponent(skipCount);
      }

      return request;
   };

   Alfresco.ConsoleNodeBrowser.prototype._toNodeBrowserResponse = function AlfDockiaCommunityShareShare_toNodeBrowserResponse(response)
   {
      var list = response && response.list ? response.list : {},
         pagination = list.pagination || {},
         entries = list.entries || [],
         results = [],
         i, wrapper, entry, nodeRef, name, path, type, score;

      for (i = 0; i < entries.length; i++)
      {
         wrapper = entries[i] || {};
         entry = wrapper.entry || wrapper;
         nodeRef = this._alfdockiaCommunityShareEntryNodeRef(entry);

         if (!nodeRef)
         {
            continue;
         }

         name = entry.name || entry.id || nodeRef;
         path = entry.path && entry.path.name ? entry.path.name : "";
         type = entry.nodeType || "";
         score = entry.search && entry.search.score ? entry.search.score : 0;

         results.push(
         {
            name: this._alfdockiaCommunityShareQName(name),
            qnamePath: this._alfdockiaCommunityShareQName(path),
            type: this._alfdockiaCommunityShareQName(type),
            nodeRef: nodeRef,
            search:
            {
               score: score,
               type: "alfdockia-community-share"
            }
         });
      }

      return (
      {
         results: results,
         startIndex: this._alfdockiaCommunityShareNumber(pagination.skipCount, 0),
         totalResults: this._alfdockiaCommunityShareNumber(pagination.totalItems, results.length),
         searchElapsedTime: this._alfdockiaCommunityShareNumber(response && response.searchElapsedTime, 0)
      });
   };

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareEntryNodeRef = function AlfDockiaCommunityShareShare_entryNodeRef(entry)
   {
      if (!entry)
      {
         return "";
      }

      if (entry.nodeRef)
      {
         return entry.nodeRef;
      }

      return entry.id ? "workspace://SpacesStore/" + entry.id : "";
   };

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareQName = function AlfDockiaCommunityShareShare_qname(value)
   {
      value = value || "";
      return (
      {
         prefixedName: value,
         name: value
      });
   };

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareNumber = function AlfDockiaCommunityShareShare_number(value, fallback)
   {
      var number = parseInt(value, 10);
      return isNaN(number) ? fallback : number;
   };

   Alfresco.ConsoleNodeBrowser.prototype._alfdockiaCommunityShareParameter = function AlfDockiaCommunityShareShare_parameter(request, name)
   {
      var match = new RegExp("(?:\\?|&)" + name + "=([^&]*)").exec(request || "");
      return match && match[1] ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
   };
})();
