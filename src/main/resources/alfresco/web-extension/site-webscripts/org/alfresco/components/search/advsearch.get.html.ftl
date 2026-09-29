<#--
  SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
  SPDX-License-Identifier: AGPL-3.0-only
-->
<@markup id="css" >
   <#-- CSS Dependencies -->
   <#include "../form/form.css.ftl"/>
   <@link href="${url.context}/res/components/search/search.css" group="search"/>
   <@link href="${url.context}/res/alfdockia-community-share/css/advanced-search-filters.css" group="search"/>
   <style type="text/css">
      .search .alfdockia-community-share-natural-box
      {
         width: 800px;
      }
      .search .alfdockia-community-share-natural-box textarea
      {
         min-height: 6em;
         width: 60em;
      }
      .search .alfdockia-community-share-description
      {
         color: #555;
         padding-top: 0.5em;
      }
      .search .alfdockia-community-share-output
      {
         margin-bottom: 1.5em;
      }
      .search .alfdockia-community-share-error
      {
         color: #b00020;
      }
   </style>
</@>

<@markup id="js">
   <#assign alfdockiaCommunityShareEnabled=(alfdockiaCommunityShare.enabled)!true>
   <#assign alfdockiaCommunityShareDefaultMaxItems=(alfdockiaCommunityShare.defaultMaxItems)!25>
   <#assign alfdockiaCommunityShareMaxItemsLimit=(alfdockiaCommunityShare.maxItemsLimit)!100>
   <#-- JavaScript Dependencies -->
   <#include "../form/form.js.ftl"/>
   <@script src="${url.context}/res/components/form/date-range.js" group="search"/>
   <@script src="${url.context}/res/components/form/number-range.js" group="search"/>
   <@script src="${url.context}/res/components/search/advsearch.js" group="search"/>
   <@inlineScript group="search">
      Alfresco.AlfDockiaCommunityShare = Alfresco.AlfDockiaCommunityShare || {};
      Alfresco.AlfDockiaCommunityShare.AdvancedSearch =
      {
         enabled: ${alfdockiaCommunityShareEnabled?string("true", "false")},
         defaultMaxItems: ${alfdockiaCommunityShareDefaultMaxItems?c},
         maxItemsLimit: ${alfdockiaCommunityShareMaxItemsLimit?c}
      };
   </@>
   <@script src="${url.context}/res/alfdockia-community-share/js/metadata-filters.js" group="search"/>
   <@script src="${url.context}/res/alfdockia-community-share/js/advanced-search-alfdockia-community-share.js" group="search"/>
</@>

<@markup id="widgets">
   <@createWidgets group="search"/>
</@>

<@markup id="html">
   <@uniqueIdDiv>
      <#assign el=args.htmlid?html>
      <div id="${el}-body" class="search">
         <div class="yui-gc form-row">
            <div class="yui-u first">
               <span class="lookfor">${msg("label.lookfor")}:</span>

               <#-- component to show list of forms, displays current form -->
               <span class="selected-form-button">
                  <span id="${el}-selected-form-button" class="yui-button yui-menu-button">
                     <span class="first-child">
                        <button type="button" tabindex="0"></button>
                     </span>
                  </span>
               </span>
               <#-- menu list of available forms -->
               <div id="${el}-selected-form-list" class="yuimenu" style="visibility:hidden">
                  <div class="bd">
                     <ul>
                        <#list searchForms as f>
                        <li>
                           <span class="form-type-name" tabindex="0">${f.label?html}</span>
                           <span class="form-type-description">${f.description?html}</span>
                        </li>
                        </#list>
                     </ul>
                  </div>
               </div>
            </div>

            <#-- search button -->
            <div class="yui-u align-right">
               <span id="${el}-search-button-1" class="yui-button yui-push-button search-icon">
                  <span class="first-child">
                     <button type="button">${msg('button.search')}</button>
                  </span>
               </span>
            </div>
         </div>

         <#-- keywords entry box - DIV structure mirrors a generated Form to collect the correct styles -->
         <div class="forms-container keywords-box">
            <div class="share-form">
               <div class="form-container">
                  <div class="form-fields">
                     <div class="set">
                        <div>${msg("label.keywords")}:</div>
                        <input type="text" class="terms" name="${el}-search-text" id="${el}-search-text" value="${(page.url.args["st"]!"")?html}" maxlength="1024" />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div id="${el}-alfdockia-community-share-form" class="forms-container alfdockia-community-share-natural-box hidden">
            <div class="share-form">
               <div class="form-container">
                  <div class="form-fields">
                     <div class="set">
                        <div><label for="${el}-alfdockia-community-share-query">${msg("alfdockia-community-share.advanced-search.query.label")}:</label></div>
                        <textarea id="${el}-alfdockia-community-share-query" class="terms" name="${el}-alfdockia-community-share-query" maxlength="4096" placeholder="${msg("alfdockia-community-share.advanced-search.query.placeholder")?html}"></textarea>
                        <div id="${el}-alfdockia-community-share-description" class="alfdockia-community-share-description"></div>
                        <div class="alfdockia-community-share-mode">
                           <label><input id="${el}-alfdockia-community-share-bulk" type="checkbox" /> ${msg("alfdockia-community-share.search.bulk")}</label>
                           <div>${msg("alfdockia-community-share.search.bulk.help")}</div>
                        </div>
                        <div class="alfdockia-community-share-filters">
                           <label><input id="${el}-alfdockia-community-share-filters-enabled" type="checkbox" /> ${msg("alfdockia-community-share.filters.enable")}</label>
                           <div id="${el}-alfdockia-community-share-filters-panel" class="alfdockia-community-share-filters-panel hidden">
                              <div id="${el}-alfdockia-community-share-filters-status" class="alfdockia-community-share-filter-status"></div>
                              <div class="alfdockia-community-share-filters-grid">
                                 <div class="alfdockia-community-share-filter-field"><label for="${el}-alfdockia-community-share-types">${msg("alfdockia-community-share.filters.types")}</label><select multiple="multiple" id="${el}-alfdockia-community-share-types"></select></div>
                                 <div class="alfdockia-community-share-filter-field"><label for="${el}-alfdockia-community-share-aspects">${msg("alfdockia-community-share.filters.aspects")}</label><select multiple="multiple" id="${el}-alfdockia-community-share-aspects"></select></div>
                              </div>
                              <div id="${el}-alfdockia-community-share-properties"></div>
                              <div class="alfdockia-community-share-filter-actions"><button type="button" id="${el}-alfdockia-community-share-property-add">${msg("alfdockia-community-share.filters.add-property")}</button> <button type="button" id="${el}-alfdockia-community-share-filters-clear">${msg("alfdockia-community-share.filters.clear")}</button></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div id="${el}-alfdockia-community-share-output" class="forms-container alfdockia-community-share-output hidden"></div>

         <#-- container for forms retrieved via ajax -->
         <div id="${el}-forms" class="forms-container form-fields"></div>

         <div class="yui-gc form-row">
            <div class="yui-u first"></div>
            <#-- search button -->
            <div class="yui-u align-right">
               <span id="${el}-search-button-2" class="yui-button yui-push-button search-icon">
                  <span class="first-child">
                     <button type="button">${msg('button.search')}</button>
                  </span>
               </span>
            </div>
         </div>
      </div>
   </@>
</@>
