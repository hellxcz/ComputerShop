﻿/// <reference path="~/scripts/breeze.debug.js" />
/// <reference path="~/scripts/backbone.stickit.js" />

(function ($, Backbone, dataservice) {
    'use strict';
    // Get templates
    var menuContent,
        menuTemplate,
        content,
        computerEditTemplate,
        nameDescriptionEditTemplate;

    $(document).ready(function () {
        documentReady();
    });

    function documentReady() {
        content = $(".main-content");
        menuContent = $("#menu-wrapper");
        loadTemplates();
    }

    var loadTemplates = function () {
        $.get('/Content/templates.tmpl.html', function (templates) {
            computerEditTemplate = $(templates).find('script#computerEditTemplate').html();
            nameDescriptionEditTemplate = $(templates).find('script#nameDescriptionEditTemplate').html();
            menuTemplate = $(templates).find('script#adminMenuTemplate').html();

            templatesLoaded();
        });
    };

    var MenuView = Backbone.View.extend({
        bindings:{
            '#items':{
                observe:'items',
                updateMethod:'html',
                onGet:function (items) {

                    var result = '';

                    items.forEach(function (item) {
                        result += '<li><a href="#" accesskey="1" class="' + item.name + '">' + item.name + '</a></li>';
                    });

                    return result;
                }
            }
        },
        events:{
            'click li':'clicked'
        },
        render:function () {
            var self = this;

            this.$el.html(menuTemplate);
            this.stickit();

            this.$el.find('.Computers').parent().addClass('current_page_item');
            this.showEditViewOf('Computers');

            $(document).find('#addNew').click(function () {
                var newItem = self.selectedItem.createFunc();
                self.selectedItem.showViewFunc(newItem, self.selectedItem.getFunc);
            });

            return this;
        },
        clicked:function (data) {
            var passedName = data.target.className;

            this.$el.find('li').each(function () {
                $(this).removeClass('current_page_item');
            });

            $(data.target.parentNode).addClass('current_page_item');
            this.showEditViewOf(passedName);
        },
        showEditViewOf:function (name) {
            var foundItem = this.getSelectedItem(name);

            foundItem.getFunc();
        },
        getSelectedItem:function (name) {
            var items = this.model.get('items'),
                foundItem;

            items.forEach(function (item) {
                if (item.name === name) {
                    foundItem = item;
                }
            });

            this.selectedItem = foundItem;

            return foundItem;
        }
    });
    var NameDescriptionEditView = Backbone.View.extend({
        bindings:{
            '#id':'id',
            '#name':'name',
            '#description':'description'
        },
        events:{
            'click #save':'save',
            'click #cancel':'cancel',
            'click #delete':'deleteAction'
        },
        render:function () {
            var self = this;

            this.$el.html(nameDescriptionEditTemplate);

            this.model.entityAspect.propertyChanged.subscribe(function (changeArgs) {
                if (changeArgs.propertyName === null || changeArgs.propertyName === 'timestamp') {
                    return;
                }
                // show save and cancel buttons
                $("#actions", self.$el).removeClass('hidden');

            });

            this.stickit();

            return this;
        },
        save:function () {
            var self = this;
            dataservice.saveChanges([this.model]).then(this.parentDataFunction);
            $("#actions", self.$el).addClass('hidden');
        },
        cancel:function () {
            var self = this;
            this.model.entityAspect.rejectChanges();
            $("#actions", self.$el).addClass('hidden');
        },
        deleteAction:function () {
            this.model.entityAspect.setDeleted();
            dataservice.saveChanges([this.model]).then(this.parentDataFunction);
        },
        parentDataFunction:function () {
        }
    });
    var ComputerEditView = Backbone.View.extend({
        bindings:{
            '#id':'id',
            'select#brand':{
                observe:'computerBrand',
                selectOptions:{
                    collection:function () {
                        return dataservice.getComputerBrandsFromCache();
                    },
                    labelPath:'attributes.name'
                }
            },
            '#description':'description',

            '#model':'computerModel',
            'select#processor':{
                observe:'processor',
                selectOptions:{
                    collection:function () {
                        return dataservice.getProcessorsFromCache();
                    },
                    labelPath:'attributes.name'
                }
            },
            '#ram-capacity':'ramCapacity',
            'select#ram-unit':{
                observe:'ramUnit',
                selectOptions:{
                    collection:function () {
                        return dataservice.getUnits();
                    },

                    labelPath:'value',
                    valuePath:'id'
                }
            },
            '#hdd-capacity':'harddiskCapacity',
            'select#hdd-unit':{
                observe:'harddiskCapacityUnit',
                selectOptions:{
                    collection:function () {
                        return dataservice.getUnits();
                    },

                    labelPath:'value',
                    valuePath:'id'
                }
            },
            '#price':'price'
        },
        events:{
            'click #save':'save',
            'click #cancel':'cancel',
            'click #delete':'deleteAction'
        },
        render:function () {
            this.$el.html(computerEditTemplate);
            var self = this;

            this.model.entityAspect.propertyChanged.subscribe(function (changeArgs) {
                if (changeArgs.propertyName === null || changeArgs.propertyName === 'timestamp') {
                    return;
                }
                // show save and cancel buttons
                $("#actions", self.$el).removeClass('hidden');

            });

            this.stickit();

            return this;
        },
        save:function () {
            var self = this;

            dataservice.saveChanges([this.model]);
            $("#actions", self.$el).addClass('hidden');

            getComputers();
        },
        cancel:function () {
            var self = this;
            this.model.entityAspect.rejectChanges();
            $("#actions", self.$el).addClass('hidden');
        },
        deleteAction:function () {
            this.model.entityAspect.setDeleted();
            dataservice.saveChanges([this.model]);

            getComputers();
        }
    });

    var getProcessors = function () {
        dataservice.getProcessors()
            .then(function (data) {
                showNameDescriptionItemViews(data, getProcessors);
            });
    };

    var getComputerBrands = function () {
        dataservice.getComputerBrands()
            .then(function (data) {
                showNameDescriptionItemViews(data, getComputerBrands);
            });
    };

    function showNameDescriptionItemViews(items, parentDataFunction) {
        content.empty();
        items.forEach(
            function (item) {
                showNameDescriptionItemView(item, parentDataFunction);
            }
        );
    }

    var showNameDescriptionItemView = function (item, parentDataFunction) {
        var view = new NameDescriptionEditView({ model:item });
        view.parentDataFunction = parentDataFunction;
        content.append(view.render().el);

    };
    var getComputers = function (computerBrandId) {
        dataservice.getComputers(computerBrandId)
            .then(gotComputers);

        function gotComputers(computers) {
            content.empty();

            computers.forEach(showComputerView);
        }
    };

    var showComputerView = function (computer) {
        var view = new ComputerEditView({ model:computer });
        content.append(view.render().el);
    };

    var showMenu = function () {

        var MenuItems = Backbone.Model.extend({

        });

        var menuItems = new MenuItems(
            {
                items:[
                    { name:"Computers", getFunc:getComputers, createFunc:dataservice.createComputer, showViewFunc:showComputerView },
                    { name:"Brands", getFunc:getComputerBrands, createFunc:dataservice.createComputerBrand, showViewFunc:showNameDescriptionItemView },
                    { name:"Processors", getFunc:getProcessors, createFunc:dataservice.createProcessor, showViewFunc:showNameDescriptionItemView }
                ]
            }
        );

        menuContent.empty();

        var view = new MenuView({ model:menuItems });
        menuContent.append(view.render().el);
    };

    function templatesLoaded() {
        showMenu();
    }
})(jQuery, Backbone, app.dataservice);