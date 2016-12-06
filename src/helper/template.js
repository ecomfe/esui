/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 模板相关辅助方法
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');

        var FILTERS = {
            'id': function (part) {
                return this.helper.getId(part);
            },

            'class': function (part) {
                return this.helper.getPartClassName(part);
            },

            'part': function (part, nodeName) {
                return this.helper.getPartHTML(part, nodeName);
            }
        };

        /**
         * @override Helper
         */
        var helper = {};

        /**
         * 获取模板引擎实例
         *
         * @return {etpl.Engine} engine 模板引擎实例
         */
        helper.getTemplateEngine = function () {
            if (!this.templateEngine) {
                var templateEngine = require('../templateEngine').get();
                this.setTemplateEngine(templateEngine);
            }
            return this.templateEngine;
        };

        /**
         * 设置模板引擎实例
         *
         * @param {etpl.Engine} engine 模板引擎实例
         */
        helper.setTemplateEngine = function (engine) {
            this.templateEngine = engine;

            if (!engine.esui) {
                this.initializeTemplateEngineExtension();
            }
        };

        /**
         * 初始化模板引擎的扩展，添加对应的过滤器
         *
         * @protected
         */
        helper.initializeTemplateEngineExtension = function () {
            var me = this;
            u.each(
                FILTERS,
                function (filter, name) {
                    filter = u.bind(filter, me.control);
                    this.addFilter(name, filter);
                },
                this.templateEngine
            );
        };

        /**
         * 生成模板替换的数据
         *
         * @param {Object} data 数据
         * @return {Object} 处理过的数据
         */
        function getTemplateData(data) {
            var templateData = {
                get: function (name) {

                    if (typeof data.get === 'function') {
                        return data.get(name);
                    }

                    var propertyName = name;
                    var filter = null;

                    var indexOfDot = name.lastIndexOf('.');
                    if (indexOfDot > 0) {
                        propertyName = name.substring(0, indexOfDot);
                        var filterName = name.substring(indexOfDot + 1);
                        if (filterName && FILTERS.hasOwnProperty(filterName)) {
                            filter = FILTERS[filterName];
                        }
                    }

                    var value = data.hasOwnProperty(propertyName)
                        ? data[propertyName]
                        : propertyName;
                    if (filter) {
                        value = filter(value, helper.control);
                    }

                    return value;
                }
            };
            return templateData;
        }

        /**
         * 通过模板引擎渲染得到字符串
         *
         * ESUI为[etpl](https://github.com/ecomfe/etpl')提供了额外的
         * [filter](https://github.com/ecomfe/etpl/#变量替换)：
         *
         * - `${xxx | id($instance)}`按规则生成以`xxx`为部件名的DOM元素id
         * - `${xxx | class($instance)}`按规则生成以`xxx`为部件名的DOM元素class
         * - `${xxx | part('div', $instance)}`生成以`xxx`为部件名的div元素HTML
         *
         * 在使用内置过滤器时，必须加上`($instance)`这一段，以将过滤器和当前控件实例关联
         *
         * 同时也可以用简化的方式使用以上的过滤器，如：
         *
         * - `${xxx.id}`等效于`${xxx | id($instance)}`
         * - `${xxx.class}`等效于`${xxx | class($instance)}`
         *
         * 需要注意`part`过滤器需要指定`nodeName`，因此不能使用以上方法简写，
         * 必须使用过滤器的语法实现
         *
         * 一般来说，如果一个控件需要使用模板，我们会为这个控件类生成一个模板引擎实例：
         *
         *     var engine = new require('etpl').Engine();
         *     // 可使用text插件来加载模板文本
         *     engine.parse(require('text!myControl.tpl.html'));
         *
         *     // 声明控件类
         *     function MyControl() {
         *         ...
         *
         * 注意模板引擎实例是一个 **控件类** 一个，而非每个实例一个。
         * 由于引擎实例的隔离，在模板中不需要对`target`命名使用前缀等方式进行防冲突处理
         * 但是如果在项目发布的过程中涉及到了模板合并的工作，如果`target`重名了，可能存在问题
         * 因此如果一个 **控件类** 使用了模板，那么在项目发布的过程中需要注意选择合适的策略来
         * 合并模板：
         *
         * - 将模板的代码内嵌到js中
         * - 所有的模板合并为一个，然后统一通过插件来加载
         *
         * 随后在控件的构造函数中，为{@link Helper}添加模板引擎实现：
         *
         *     function MyClass() {
         *         // 调用基类构造函数
         *         Control.apply(this, arguments);
         *
         *         // 设置模板引擎实例
         *         this.helper.setTemplateEngine(engine);
         *     }
         *
         * 在控件的实现中，即可使用本方法输出HTML：
         *
         *     MyClass.prototype.initStructure = function () {
         *         this.main.innerHTML =
         *             this.helper.renderTemplate('content', data);
         *     }
         *
         * 需要注意，使用此方法时，仅满足以下所有条件时，才可以使用内置的过滤器：
         *
         * - `data`对象仅一层属性，即不能使用`${user.name}`这一形式访问深层的属性
         *
         * 另外此方法存在微小的几乎可忽略不计的性能损失，
         * 但如果需要大量使用模板同时又不需要内置的过滤器，可以使用以下代码代替：
         *
         *     this.helper.templateEngine.render(target, data);
         *
         * @param {string} target 模板名
         * @param {Object} [data] 用于模板渲染的数据
         * @return {string}
         */
        helper.renderTemplate = function (target, data) {
            data = data || {};
            var engine = this.getTemplateEngine();
            return engine.render(target, getTemplateData(data));
        };

        /*
         * 渲染模板内容
         *
         * @param {string} content 模板内容
         * @param {Object} [data] 用于模板渲染的数据
         * @return {string}
         */
        helper.render = function (content, data) {
            data = data || {};
            var engine = this.getTemplateEngine();
            var renderer = engine.compile(content);
            return renderer(getTemplateData(data));
        };

        return helper;
    }
);