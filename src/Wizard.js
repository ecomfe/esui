/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 多步骤导航控件
 * @author otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        // css
        require('css!./css/Wizard.css');

        /**
         * 多步骤导航控件
         *
         * @constructor
         */
        function Wizard() {
            Control.apply(this, arguments);
        }

        Wizard.prototype.type = 'Wizard';

        /**
         * 创建控件主元素
         *
         * @return {HTMLElement}
         * @override
         * @protected
         */
        Wizard.prototype.createMain = function () {
            return document.createElement('ol');
        };

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Wizard.prototype.initOptions = function (options) {
            var properties = {
                steps: [],
                activeIndex: 0
            };

            var children = lib.getChildren(this.main);
            if (!options.path && children.length) {
                for (var i = 0; i < children.length; i++) {
                    var node = children[i];
                    var config = { text: lib.getText(node) };
                    var panel = node.getAttribute('data-for');
                    if (panel) {
                        config.panel = panel;
                    }
                    properties.steps.push(config);
                }
            }

            lib.extend(properties, options);
            this.setProperties(properties);
        };

        /**
         * 控制对应面板的显示或隐藏
         *
         * @param {Wizard} wizard 控件实例
         * @param {Object} config 对应的步骤配置项
         * @param {boolean} isActive 是否处于激活状态
         */
        function togglePanel(wizard, config, isActive) {
            var panel = config && config.panel && lib.g(config.panel);

            if (!panel) {
                return;
            }

            var method = isActive ? 'removePartClasses' : 'addPartClasses';
            helper[method](wizard, 'panel-hidden', panel);
        }

        /**
         * 节点内容的HTML模板
         *
         * @type {string}
         * @public
         */
        Wizard.prototype.nodeTemplate = '<span>${text}</span>';

        /**
         * 获取节点内容HTML
         *
         * @param {Object} node 节点数据项
         * @param {string} node.text 显示的文字
         * @return {string}
         * @public
         */
        Wizard.prototype.getNodeHTML = function (node) {
            return lib.format(
                this.nodeTemplate,
                {
                    text: lib.encodeHTML(node.text)
                }
            );
        };

        /**
         * 获取导航HTML
         *
         * @param {Wizard} Wizard 控件实例
         * @return {string}
         *
         * @inner
         */
        function getHTML(wizard) {
            var html = '';

            for (var i = 0; i < wizard.steps.length; i++) {
                var node = wizard.steps[i];

                var classes = helper.getPartClasses(wizard, 'node');
                if (i === 0) {
                    classes = classes.concat(
                        helper.getPartClasses(wizard, 'node-first')
                    );
                }
                if (i === wizard.steps.length - 1 && !wizard.finishText) {
                    classes = classes.concat(
                        helper.getPartClasses(wizard, 'node-last')
                    );
                }

                // 当前步之前的一步
                if (i === (wizard.activeIndex - 1)) {
                    classes = classes.concat(
                        helper.getPartClasses(wizard, 'node-active-prev')
                    );
                }
                if (i <= (wizard.activeIndex - 1)) {
                    classes = classes.concat(
                        helper.getPartClasses(wizard, 'node-done')
                    );
                }

                var isActive = i === wizard.activeIndex;
                togglePanel(wizard, node, isActive);
                if (isActive) {
                    classes = classes.concat(
                        helper.getPartClasses(wizard, 'node-active')
                    );
                    if (i === wizard.steps.length - 1) {
                        classes = classes.concat(
                            helper.getPartClasses(wizard, 'node-last-active')
                        );
                    }
                }

                html += '<li class="' + classes.join(' ') + '">';
                html += wizard.getNodeHTML(node);
                html += '</li>';
            }

            if (wizard.finishText) {
                var classes = [].concat(
                    helper.getPartClasses(wizard, 'node'),
                    helper.getPartClasses(wizard, 'node-last'),
                    helper.getPartClasses(wizard, 'node-finish'),
                    wizard.activeIndex === wizard.steps.length
                        ? helper.getPartClasses(wizard, 'node-active')
                        : []
                );
                html += '<li class="' + classes.join(' ') + '">';
                html += '<span>' + wizard.finishText + '</span>';
                html += '</li>';
            }

            return html;
        }

        var paint = require('./painters');
        var repaint = helper.createRepaint(
            Control.prototype.repaint,
            paint.html('steps', null, getHTML),
            paint.html('finishText', null, getHTML),
            {
                name: 'activeIndex',
                paint: function (wizard, value) {
                    var nodes = wizard.main.getElementsByTagName('li');
                    for (var i = nodes.length - 1; i >= 0; i--) {
                        var isActive = i === wizard.activeIndex;
                        togglePanel(wizard, wizard.steps[i], isActive);

                        var node = nodes[i];
                        var method = isActive
                            ? 'addPartClasses'
                            : 'removePartClasses';
                        helper[method](wizard, 'node-active', node);

                        if (i === wizard.steps.length - 1) {
                            helper[method](wizard, 'node-last-active', node);
                        }

                        var isDone = i <= (wizard.activeIndex - 1);
                        var method = isDone
                            ? 'addPartClasses'
                            : 'removePartClasses';
                        helper[method](wizard, 'node-done', node);

                        var isCurPrev = i === (wizard.activeIndex - 1);
                        var method = isCurPrev
                            ? 'addPartClasses'
                            : 'removePartClasses';
                        helper[method](wizard, 'node-active-prev', node);
                    }
                }
            }
        );

        /**
         * 渲染自身
         *
         * @override
         * @protected
         */
        Wizard.prototype.repaint = function (changes) {
            Control.prototype.repaint.apply(this, arguments);
            // 第一次渲染的时候同时有`steps`和`activeIndex`属性，
            // 这会导致连续执行2个`painter`，因此要特别处理改成一次
            if (!changes) {
                this.main.innerHTML = getHTML(this);
            }
            else {
                repaint.apply(this, arguments);
            }
        };

        Wizard.prototype.setProperties = function (properties) {
            if (properties.hasOwnProperty('steps')) {
                // 如果同时有`activeIndex`和`steps`，
                // 则`activeIndex`可以只赋在实例上不丢进更新列表，
                // 因为`getHTML`是会处理这事的
                if (properties.hasOwnProperty('activeIndex')) {
                    this.activeIndex = properties.activeIndex;
                    delete properties.activeIndex;
                }
                // 如果没给`activeIndex`，则回到最初那一步
                else {
                    this.activeIndex = 0;
                }

                // 如果同时有`steps`和`finishText`，由于这两个都会引发全刷新，
                // 因此只要保留一个就行了
                if (properties.hasOwnProperty('finishText')) {
                    this.finishText = properties.finishText;
                    delete properties.finishText;
                }
            }

            var changes = 
                Control.prototype.setProperties.apply(this, arguments);
            if (changes.hasOwnProperty('steps')
                || changes.hasOwnProperty('activeIndex')
            ) {
                this.fire('enter');
            }
        };

        Wizard.prototype.getActiveStep = function () {
            return this.steps[this.activeIndex];
        };

        Wizard.prototype.stepNext = function () {
            var maxStep = this.finishText 
                ? this.steps.length 
                : this.steps.length - 1;
            if (this.activeIndex < maxStep) {
                this.set('activeIndex', this.activeIndex + 1);
            }
        };

        Wizard.prototype.stepPrevious = function () {
            if (this.activeIndex > 0) {
                this.set('activeIndex',this.activeIndex - 1);
            }
        };

        require('./main').register(Wizard);
        lib.inherits(Wizard, Control);

        return Wizard;
    }
);