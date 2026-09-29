/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Search list that keeps the semantic-search descriptor in the URL hash.
 *
 * Aikau normally removes "query" when a search is repeated or changed. For
 * AlfDockia that value also carries the marker used by SearchService to
 * route the request, so removing it accidentally turns the request into a
 * regular Alfresco query.
 */
define(["dojo/_base/declare",
        "alfresco/search/AlfSearchList",
        "dojo/json"],
        function(declare, AlfSearchList, dojoJson) {

   return declare([AlfSearchList], {

      _cleanResettableHashTerms: function alfdockia_community_share_search_SearchList___cleanResettableHashTerms(currHash) {
         var hasTerm = false,
            term;

         if (!this._isAlfDockiaCommunityShareQuery(currHash && currHash.query))
         {
            return this.inherited(arguments);
         }

         for (term in currHash)
         {
            if (currHash.hasOwnProperty(term) &&
                term !== "query" &&
                this._resetVars.indexOf(term) !== -1 &&
                currHash[term] !== null && currHash[term] !== "")
            {
               hasTerm = true;
               delete currHash[term];
            }
         }
         return hasTerm;
      },

      _isAlfDockiaCommunityShareQuery: function alfdockia_community_share_search_SearchList___isAlfDockiaCommunityShareQuery(query) {
         var decoded = query,
            parsed,
            attempt;

         if (query && typeof query === "object")
         {
            return query.alfdockiaCommunityShareSearch === true || query.alfdockiaCommunityShareSearch === "true";
         }
         if (typeof query !== "string")
         {
            return false;
         }

         for (attempt = 0; attempt < 3; attempt++)
         {
            try
            {
               parsed = dojoJson.parse(decoded);
               return parsed && (parsed.alfdockiaCommunityShareSearch === true || parsed.alfdockiaCommunityShareSearch === "true");
            }
            catch (ignore)
            {
               try
               {
                  decoded = decodeURIComponent(decoded);
               }
               catch (invalidEncoding)
               {
                  return false;
               }
            }
         }
         return false;
      }
   });
});
