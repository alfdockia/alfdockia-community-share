/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Lightweight result renderer for AlfDockia IA searches.
 *
 * Only selection remains an Aikau child widget. All visible metadata is
 * rendered as plain DOM to avoid creating multiple Dojo widgets per result.
 * Thumbnails, previews and action renderers are intentionally omitted.
 */
define(["dojo/_base/declare",
        "alfresco/lists/views/layouts/Row",
        "alfresco/renderers/Selector",
        "dojo/dom-construct",
        "dojo/dom-class"],
        function(declare, Row, Selector, domConstruct, domClass) {

   return declare([Row], {

      cssRequirements: [
         { cssFile: "./css/SearchResult.css" }
      ],

      showSelector: true,

      postCreate: function alfdockia_community_share_search_SearchResult__postCreate() {
         domClass.add(this.domNode, "alfdockia-community-share-search-result");

         this._createStructure();
         this._createSelector();
         this._createIcon();
         this._renderNameAndTitle();
         this._renderDescription();
         this._renderDateAndSize();
         this._renderPath();
      },

      _createStructure: function alfdockia_community_share_search_SearchResult___createStructure() {
         this.selectorCell = domConstruct.create("td", { className: "selectorCell" }, this.domNode);
         this.selectorNode = domConstruct.create("div", {}, this.selectorCell);

         this.thumbnailCell = domConstruct.create("td", { className: "thumbnailCell" }, this.domNode);
         this.thumbnailNode = domConstruct.create("div", {}, this.thumbnailCell);

         this.propertiesCell = domConstruct.create("td", { className: "propertiesCell" }, this.domNode);
         this.nameAndTitleCell = domConstruct.create("div", { className: "nameAndTitleCell" }, this.propertiesCell);
         this.descriptionRow = domConstruct.create("div", { className: "descriptionCell" }, this.propertiesCell);
         this.dateCell = domConstruct.create("div", { className: "dateCell" }, this.propertiesCell);
         this.pathRow = domConstruct.create("div", { className: "pathCell" }, this.propertiesCell);

         domConstruct.create("td", { className: "actionsCell alfdockia-community-share-search-result-actions" }, this.domNode);
      },

      _createSelector: function alfdockia_community_share_search_SearchResult___createSelector() {
         if (!this.showSelector)
         {
            domClass.add(this.selectorCell, "hidden");
            return;
         }

         new Selector(
         {
            id: this.id + "_SELECTOR",
            currentItem: this.currentItem,
            pubSubScope: this.pubSubScope
         }, this.selectorNode);
      },

      _createIcon: function alfdockia_community_share_search_SearchResult___createIcon() {
         domConstruct.create("div",
         {
            className: this.currentItem.type === "folder" ? "alfdockia-community-share-search-result-icon folder" : "alfdockia-community-share-search-result-icon document"
         }, this.thumbnailNode);
      },

      _renderNameAndTitle: function alfdockia_community_share_search_SearchResult___renderNameAndTitle() {
         this._createLink(
            this.nameAndTitleCell,
            this._documentUrl(),
            this.currentItem.displayName || this.currentItem.name || "Documento",
            "alfdockia-community-share-search-result-name"
         );

         if (this.currentItem.title)
         {
            domConstruct.create("span",
            {
               className: "alfdockia-community-share-search-result-title",
               innerHTML: " (" + this._escape(this.currentItem.title) + ")"
            }, this.nameAndTitleCell);
         }
      },

      _renderDescription: function alfdockia_community_share_search_SearchResult___renderDescription() {
         if (!this.currentItem.description)
         {
            domClass.add(this.descriptionRow, "hidden");
            return;
         }

         domConstruct.create("span",
         {
            innerHTML: this._escape(this.currentItem.description)
         }, this.descriptionRow);
      },

      _renderDateAndSize: function alfdockia_community_share_search_SearchResult___renderDateAndSize() {
         var modifiedBy = this.currentItem.modifiedBy || this.currentItem.modifiedByUser || "",
            modifiedByUser = this.currentItem.modifiedByUser || "",
            dateText = this._formatDate(this.currentItem.modifiedOn),
            sizeText = this._formatSize(this.currentItem.size);

         if (dateText)
         {
            domConstruct.create("span",
            {
               className: "alfdockia-community-share-search-result-date",
               innerHTML: this._escape(dateText) + (modifiedBy ? " por " : "")
            }, this.dateCell);
         }

         if (modifiedBy)
         {
            if (modifiedByUser)
            {
               this._createLink(this.dateCell, this._profileUrl(modifiedByUser), modifiedBy, "alfdockia-community-share-search-result-author");
            }
            else
            {
               domConstruct.create("span", { innerHTML: this._escape(modifiedBy) }, this.dateCell);
            }
         }

         if (sizeText)
         {
            domConstruct.create("span",
            {
               className: "alfdockia-community-share-search-result-size",
               innerHTML: (dateText || modifiedBy ? " | " : "") + "Tama\u00f1o: " + this._escape(sizeText)
            }, this.dateCell);
         }
      },

      _renderPath: function alfdockia_community_share_search_SearchResult___renderPath() {
         if (!this.currentItem.path)
         {
            domClass.add(this.pathRow, "hidden");
            return;
         }

         domConstruct.create("span", { innerHTML: "En carpeta: " }, this.pathRow);
         this._createLink(this.pathRow, this._pathUrl(), this.currentItem.path, "alfdockia-community-share-search-result-path");
      },

      _createLink: function alfdockia_community_share_search_SearchResult___createLink(parent, href, label, className) {
         return domConstruct.create("a",
         {
            className: className,
            href: href,
            innerHTML: this._escape(label)
         }, parent);
      },

      _documentUrl: function alfdockia_community_share_search_SearchResult___documentUrl() {
         var site = this.currentItem.site && this.currentItem.site.shortName ?
               "site/" + encodeURIComponent(this.currentItem.site.shortName) + "/" : "";
         return this._pageContext() + site + "document-details?nodeRef=" + encodeURIComponent(this.currentItem.nodeRef || "");
      },

      _profileUrl: function alfdockia_community_share_search_SearchResult___profileUrl(userName) {
         return this._pageContext() + "user/" + encodeURIComponent(userName) + "/profile";
      },

      _pathUrl: function alfdockia_community_share_search_SearchResult___pathUrl() {
         var path = String(this.currentItem.path || ""),
            siteName = this.currentItem.site && this.currentItem.site.shortName;

         if (path.charAt(0) !== "/")
         {
            path = "/" + path;
         }

         if (siteName)
         {
            return this._pageContext() + "site/" + encodeURIComponent(siteName) +
               "/documentlibrary?path=" + encodeURIComponent(path);
         }

         path = "/" + path.split("/").slice(2).join("/");
         return this._pageContext() + "repository?path=" + encodeURIComponent(path);
      },

      _pageContext: function alfdockia_community_share_search_SearchResult___pageContext() {
         if (typeof Alfresco !== "undefined" && Alfresco.constants && Alfresco.constants.URL_PAGECONTEXT)
         {
            return Alfresco.constants.URL_PAGECONTEXT;
         }
         return "/share/page/";
      },

      _formatDate: function alfdockia_community_share_search_SearchResult___formatDate(value) {
         var date;
         if (!value)
         {
            return "";
         }
         date = new Date(value);
         return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
      },

      _formatSize: function alfdockia_community_share_search_SearchResult___formatSize(value) {
         var size = parseFloat(value),
            units = ["bytes", "KB", "MB", "GB"],
            unit = 0;

         if (isNaN(size) || size < 0)
         {
            return "";
         }
         while (size >= 1024 && unit < units.length - 1)
         {
            size /= 1024;
            unit++;
         }
         return (unit === 0 ? Math.round(size) : Math.round(size * 10) / 10) + " " + units[unit];
      },

      _escape: function alfdockia_community_share_search_SearchResult___escape(value) {
         value = value === null || value === undefined ? "" : String(value);
         return value.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
      }
   });
});
