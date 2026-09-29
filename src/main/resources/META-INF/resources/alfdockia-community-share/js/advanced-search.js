/**
 * @license
 * SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Adds AlfDockia IA semantic search to the Alfresco Share Advanced Search screen.
 */
(function()
{
   if (typeof Alfresco === "undefined" || !Alfresco.AdvancedSearch)
   {
      return;
   }

   if (Alfresco.AdvancedSearch.prototype._alfdockiaCommunityShareAdvancedPatched)
   {
      return;
   }

   var Dom = YAHOO.util.Dom,
      originalRenderFormTemplate = Alfresco.AdvancedSearch.prototype.renderFormTemplate,
      originalOnSearchClick = Alfresco.AdvancedSearch.prototype.onSearchClick;

   Alfresco.AdvancedSearch.prototype._alfdockiaCommunityShareAdvancedPatched = true;

   Alfresco.AdvancedSearch.prototype.renderFormTemplate = function AlfDockiaCommunityShareAdvanced_renderFormTemplate(form, repopulate)
   {
      if (this._isAlfDockiaCommunityShareAdvancedForm(form))
      {
         this.currentForm = form;
         this.currentForm.repopulate = repopulate;
         this._showAlfDockiaCommunityShareAdvancedForm(form);
         return;
      }

      this._hideAlfDockiaCommunityShareAdvancedForm();
      return originalRenderFormTemplate.call(this, form, repopulate);
   };

   Alfresco.AdvancedSearch.prototype.onSearchClick = function AlfDockiaCommunityShareAdvanced_onSearchClick(e, obj)
   {
      if (this._isAlfDockiaCommunityShareAdvancedForm(this.currentForm))
      {
         YAHOO.util.Event.preventDefault(e);
         this._executeAlfDockiaCommunityShareAdvancedSearch();
         return;
      }

      return originalOnSearchClick.call(this, e, obj);
   };

   Alfresco.AdvancedSearch.prototype._showAlfDockiaCommunityShareAdvancedForm = function AlfDockiaCommunityShareAdvanced_showForm(form)
   {
      var normalForms = Dom.get(this.id + "-forms"),
         aiForm = Dom.get(this.id + "-alfdockia-community-share-form"),
         description = Dom.get(this.id + "-alfdockia-community-share-description"),
         textArea = Dom.get(this.id + "-alfdockia-community-share-query");

      this._setAlfDockiaCommunityShareKeywordBoxVisible(false);

      if (normalForms)
      {
         Dom.addClass(normalForms, "hidden");
      }
      if (aiForm)
      {
         Dom.removeClass(aiForm, "hidden");
      }
      if (description)
      {
         description.innerHTML = this._alfdockiaCommunityShareAdvancedEscape(form.description || "");
      }
      if (textArea)
      {
         textArea.focus();
      }
      this._initAlfDockiaCommunityShareFilters();
   };

   Alfresco.AdvancedSearch.prototype._hideAlfDockiaCommunityShareAdvancedForm = function AlfDockiaCommunityShareAdvanced_hideForm()
   {
      var normalForms = Dom.get(this.id + "-forms"),
         aiForm = Dom.get(this.id + "-alfdockia-community-share-form"),
         output = Dom.get(this.id + "-alfdockia-community-share-output");

      this._setAlfDockiaCommunityShareKeywordBoxVisible(true);

      if (normalForms)
      {
         Dom.removeClass(normalForms, "hidden");
      }
      if (aiForm)
      {
         Dom.addClass(aiForm, "hidden");
      }
      if (output)
      {
         output.innerHTML = "";
         Dom.addClass(output, "hidden");
      }
   };

   Alfresco.AdvancedSearch.prototype._setAlfDockiaCommunityShareKeywordBoxVisible = function AlfDockiaCommunityShareAdvanced_setKeywordBoxVisible(visible)
   {
      var boxes = Dom.getElementsByClassName("keywords-box", "div", this.id + "-body"),
         i;

      for (i = 0; i < boxes.length; i++)
      {
         if (visible)
         {
            Dom.removeClass(boxes[i], "hidden");
         }
         else
         {
            Dom.addClass(boxes[i], "hidden");
         }
      }
   };

   Alfresco.AdvancedSearch.prototype._executeAlfDockiaCommunityShareAdvancedSearch = function AlfDockiaCommunityShareAdvanced_execute()
   {
      var config = this._alfdockiaCommunityShareAdvancedConfig(),
         textArea = Dom.get(this.id + "-alfdockia-community-share-query"),
         query = textArea && textArea.value ? textArea.value.replace(/^\s+|\s+$/g, "") : "",
         maxItems = Math.min(config.defaultMaxItems, config.maxItemsLimit);

      if (!config.enabled)
      {
         this._renderAlfDockiaCommunityShareAdvancedError("AlfDockia IA esta deshabilitado.");
         return;
      }

      if (!query)
      {
         this._renderAlfDockiaCommunityShareAdvancedError("Escribe una consulta en lenguaje natural.");
         return;
      }

      this._redirectAlfDockiaCommunityShareAdvancedSearch(
         query, maxItems, this._alfdockiaCommunityShareMetadataFilters(), this._alfdockiaCommunityShareAdvancedMode());
   };

   Alfresco.AdvancedSearch.prototype._redirectAlfDockiaCommunityShareAdvancedSearch = function AlfDockiaCommunityShareAdvanced_redirect(query, maxItems, metadataFilters, mode)
   {
      var searchPath = this.options.searchPath || "{site}dp/ws/faceted-search#searchTerm={terms}&query={query}&scope={scope}",
         queryData =
         {
            alfdockiaCommunityShareSearch: true,
            alfdockiaCommunityShareQuery: query,
            alfdockiaCommunityShareMaxItems: maxItems,
            alfdockiaCommunityShareFilters: metadataFilters,
            alfdockiaCommunityShareMode: mode === "bulk" ? "bulk" : "interactive",
            alfdockiaCommunityShareIncludeTotal: mode === "bulk"
         },
         url = YAHOO.lang.substitute(Alfresco.constants.URL_PAGECONTEXT + searchPath,
         {
            site: (this.options.siteId.length !== 0 ? ("site/" + this.options.siteId + "/") : ""),
            terms: encodeURIComponent(query),
            query: encodeURIComponent(YAHOO.lang.JSON.stringify(queryData)),
            scope: this.options.searchScope.toString()
         });

      window.location.href = url;
   };

   Alfresco.AdvancedSearch.prototype._alfdockiaCommunityShareAdvancedMode = function AlfDockiaCommunityShareAdvanced_mode()
   {
      var bulk = Dom.get(this.id + "-alfdockia-community-share-bulk");
      return bulk && bulk.checked ? "bulk" : "interactive";
   };

   Alfresco.AdvancedSearch.prototype._initAlfDockiaCommunityShareFilters = function AlfDockiaCommunityShareAdvanced_initFilters()
   {
      var self = this, enabled = Dom.get(this.id + "-alfdockia-community-share-filters-enabled"), add, clear;
      if (!enabled || enabled._alfdockiaBound) { return; }
      enabled._alfdockiaBound = true;
      enabled.onclick = function() { self._toggleAlfDockiaCommunityShareFilters(enabled.checked); };
      add = Dom.get(this.id + "-alfdockia-community-share-property-add");
      clear = Dom.get(this.id + "-alfdockia-community-share-filters-clear");
      if (add) { add.onclick = function() { self._addAlfDockiaCommunitySharePropertyRule(); }; }
      if (clear) { clear.onclick = function() { self._clearAlfDockiaCommunityShareFilters(); }; }
   };

   Alfresco.AdvancedSearch.prototype._toggleAlfDockiaCommunityShareFilters = function AlfDockiaCommunityShareAdvanced_toggleFilters(enabled)
   {
      var panel = Dom.get(this.id + "-alfdockia-community-share-filters-panel");
      if (panel) { enabled ? Dom.removeClass(panel, "hidden") : Dom.addClass(panel, "hidden"); }
      if (enabled && !this._alfdockiaCommunityShareDictionaryLoading && !this._alfdockiaCommunityShareDictionary)
      {
         this._loadAlfDockiaCommunityShareDictionary();
      }
   };

   Alfresco.AdvancedSearch.prototype._loadAlfDockiaCommunityShareDictionary = function AlfDockiaCommunityShareAdvanced_loadDictionary()
   {
      var self = this, statusNode = Dom.get(this.id + "-alfdockia-community-share-filters-status");
      this._alfdockiaCommunityShareDictionaryLoading = true;
      if (statusNode) { statusNode.innerHTML = "Cargando modelos de Alfresco…"; }
      YAHOO.util.Connect.asyncRequest("GET", Alfresco.constants.URL_SERVICECONTEXT + "alfdockia-community-share/dictionary",
      {
         success: function(response)
         {
            self._alfdockiaCommunityShareDictionaryLoading = false;
            self._alfdockiaCommunityShareDictionary = YAHOO.lang.JSON.parse(response.responseText);
            self._renderAlfDockiaCommunityShareDictionary();
            if (statusNode) { statusNode.innerHTML = ""; }
         },
         failure: function()
         {
            self._alfdockiaCommunityShareDictionaryLoading = false;
            if (statusNode) { statusNode.innerHTML = "No se pudo cargar el diccionario. Puedes buscar sin filtros."; }
         }
      });
   };

   Alfresco.AdvancedSearch.prototype._renderAlfDockiaCommunityShareDictionary = function AlfDockiaCommunityShareAdvanced_renderDictionary()
   {
      this._fillAlfDockiaCommunityShareSelect(Dom.get(this.id + "-alfdockia-community-share-types"), this._alfdockiaCommunityShareDictionary.types || []);
      this._fillAlfDockiaCommunityShareSelect(Dom.get(this.id + "-alfdockia-community-share-aspects"), this._alfdockiaCommunityShareDictionary.aspects || []);
   };

   Alfresco.AdvancedSearch.prototype._fillAlfDockiaCommunityShareSelect = function AlfDockiaCommunityShareAdvanced_fillSelect(select, values)
   {
      var i, option;
      if (!select) { return; }
      select.options.length = 0;
      for (i = 0; i < values.length; i++)
      {
         option = document.createElement("option");
         option.value = values[i].name;
         option.text = (values[i].title || values[i].name) + " (" + values[i].name + ")";
         select.appendChild(option);
      }
   };

   Alfresco.AdvancedSearch.prototype._addAlfDockiaCommunitySharePropertyRule = function AlfDockiaCommunityShareAdvanced_addRule(initial)
   {
      var container = Dom.get(this.id + "-alfdockia-community-share-properties"), row, propertySelect, operatorSelect, input, remove,
         dictionary = this._alfdockiaCommunityShareDictionary || { properties: {} }, key, option, self = this;
      if (!container || container.childNodes.length >= 20) { return; }
      row = document.createElement("div"); row.className = "alfdockia-community-share-property-row";
      propertySelect = document.createElement("select"); propertySelect.className = "alfdockia-community-share-property";
      for (key in dictionary.properties)
      {
         if (dictionary.properties.hasOwnProperty(key))
         {
            option = document.createElement("option"); option.value = key;
            option.text = (dictionary.properties[key].title || key) + " (" + key + ")";
            propertySelect.appendChild(option);
         }
      }
      operatorSelect = document.createElement("select"); operatorSelect.className = "alfdockia-community-share-operator";
      input = document.createElement("input"); input.className = "alfdockia-community-share-value"; input.type = "text";
      remove = document.createElement("button"); remove.type = "button"; remove.appendChild(document.createTextNode("×"));
      row.appendChild(propertySelect); row.appendChild(operatorSelect); row.appendChild(input); row.appendChild(remove); container.appendChild(row);
      function refresh()
      {
         var prop = dictionary.properties[propertySelect.value] || { dataType: "d:text" }, operators = Alfresco.AlfDockiaCommunityShare.MetadataFilters.operatorsFor(prop), i, item;
         operatorSelect.options.length = 0;
         for (i = 0; i < operators.length; i++) { item = document.createElement("option"); item.value = operators[i].value; item.text = operators[i].label; operatorSelect.appendChild(item); }
         row._alfdockiaCommunityShareProperty = prop;
      }
      propertySelect.onchange = refresh; remove.onclick = function() { container.removeChild(row); };
      if (initial && initial.name) { propertySelect.value = initial.name; }
      refresh();
      if (initial) { operatorSelect.value = initial.operator || "eq"; input.value = initial.value === undefined ? "" : initial.value; }
   };

   Alfresco.AdvancedSearch.prototype._alfdockiaCommunityShareMetadataFilters = function AlfDockiaCommunityShareAdvanced_metadataFilters()
   {
      var enabled = Dom.get(this.id + "-alfdockia-community-share-filters-enabled"), contract = { version: 1, types: [], aspects: [], properties: [] },
         collect = function(select) { var values = [], i; if (select) { for (i = 0; i < select.options.length; i++) { if (select.options[i].selected) { values.push(select.options[i].value); } } } return values; },
         container, rows, i, propertySelect, operatorSelect, input, prop, value;
      if (!enabled || !enabled.checked) { return null; }
      contract.types = collect(Dom.get(this.id + "-alfdockia-community-share-types"));
      contract.aspects = collect(Dom.get(this.id + "-alfdockia-community-share-aspects"));
      container = Dom.get(this.id + "-alfdockia-community-share-properties"); rows = container ? container.childNodes : [];
      for (i = 0; i < rows.length; i++)
      {
         propertySelect = rows[i].getElementsByTagName("select")[0]; operatorSelect = rows[i].getElementsByTagName("select")[1]; input = rows[i].getElementsByTagName("input")[0]; prop = rows[i]._alfdockiaCommunityShareProperty || {};
         value = input ? input.value : "";
         if (prop.dataType === "d:boolean") { value = String(value).toLowerCase() === "true"; }
         else if (/^d:(int|long|float|double|decimal)$/.test(prop.dataType)) { value = parseFloat(value); }
         if (operatorSelect.value === "between" || /^(in|contains_)/.test(operatorSelect.value)) { value = String(input.value).split(","); }
         contract.properties.push({ name: propertySelect.value, operator: operatorSelect.value, value: value, dataType: prop.dataType || "d:text" });
      }
      return Alfresco.AlfDockiaCommunityShare.MetadataFilters.normalizeContract(contract);
   };

   Alfresco.AdvancedSearch.prototype._clearAlfDockiaCommunityShareFilters = function AlfDockiaCommunityShareAdvanced_clearFilters()
   {
      var types = Dom.get(this.id + "-alfdockia-community-share-types"), aspects = Dom.get(this.id + "-alfdockia-community-share-aspects"), properties = Dom.get(this.id + "-alfdockia-community-share-properties"), i;
      for (i = 0; types && i < types.options.length; i++) { types.options[i].selected = false; }
      for (i = 0; aspects && i < aspects.options.length; i++) { aspects.options[i].selected = false; }
      if (properties) { properties.innerHTML = ""; }
   };

   Alfresco.AdvancedSearch.prototype._renderAlfDockiaCommunityShareAdvancedError = function AlfDockiaCommunityShareAdvanced_renderError(message)
   {
      var output = Dom.get(this.id + "-alfdockia-community-share-output");
      if (!output)
      {
         return;
      }
      output.innerHTML = '<div class="alfdockia-community-share-error">' + this._alfdockiaCommunityShareAdvancedEscape(message) + "</div>";
      Dom.removeClass(output, "hidden");
   };

   Alfresco.AdvancedSearch.prototype._isAlfDockiaCommunityShareAdvancedForm = function AlfDockiaCommunityShareAdvanced_isForm(form)
   {
      var value = form ? String(form.type || form.id || "").toLowerCase() : "";
      return value === "alfdockia-community-share-search";
   };

   Alfresco.AdvancedSearch.prototype._alfdockiaCommunityShareAdvancedConfig = function AlfDockiaCommunityShareAdvanced_config()
   {
      var config = Alfresco.AlfDockiaCommunityShare && Alfresco.AlfDockiaCommunityShare.AdvancedSearch ? Alfresco.AlfDockiaCommunityShare.AdvancedSearch : {};
      return (
      {
         enabled: config.enabled !== false,
         defaultMaxItems: this._alfdockiaCommunityShareAdvancedNumber(config.defaultMaxItems, 25),
         maxItemsLimit: this._alfdockiaCommunityShareAdvancedNumber(config.maxItemsLimit, 100)
      });
   };

   Alfresco.AdvancedSearch.prototype._alfdockiaCommunityShareAdvancedNumber = function AlfDockiaCommunityShareAdvanced_number(value, fallback)
   {
      var number = parseInt(value, 10);
      return isNaN(number) ? fallback : number;
   };

   Alfresco.AdvancedSearch.prototype._alfdockiaCommunityShareAdvancedEscape = function AlfDockiaCommunityShareAdvanced_escape(value)
   {
      value = value === null || value === undefined ? "" : String(value);
      return value.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;");
   };
})();
