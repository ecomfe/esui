/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 多步骤导航控件
 * @author otakustay
 */
define(
    function (require) {
        var u  = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');

        /**
         * 多步骤导航控件
         *
         * 一个简单的展示控件，用于显示多步骤的导航，能区分当前节点，已完成节点，最终节点等
         *
         * @extends Control
         * @constructor
         */
        function Wizard() {
            Control.apply(this, arguments);
        }

        /**
         * 控件类型，始终为`"Wizard"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        Wizard.prototype.type = 'Wizard';

        /**
         * 创建控件主元素
         *
         * @return {HTMLElement}
         * @protected
         * @override
         */
        Wizard.prototype.createMain = function () {
            return document.createElement('ol');
        };

        /**
         * 初始化参数
         *
         * 如果初始化时未给出{@link Wizard#steps}属性，则按以下规则从主元素下提取：
         *
         * 1. 遍历主元素的所有子元素
         * 2. 使用子元素的文本内容作为节点的`text`属性
         * 3. 使用子元素的`data-for`作为节点的`panel`属性
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        Wizard.prototype.initOptions = function (options) {
            var properties = {
                steps: [],
                activeIndex: 0
            };

            var children = lib.getChildren(this.main);
            if (!options.steps && children.length) {
                properties.steps = u.map(
                    children,
                    function (node) {
                        var config = { text: lib.getText(node) };
                        var panel = node.getAttribute('data-for');
                        if (panel) {
                            config.panel = panel;
                        }
                        return config;
                    }
                );
            }

            u.extend(properties, options);

            if (typeof properties.activeIndex === 'string') {
                properties.activeIndex = +properties.activeIndex;
            }

            this.setProperties(properties);
        };

        /**
         * 控制对应面板的显示或隐藏
         *
         * @param {Wizard} wizard 控件实例
         * @param {Object} config 对应的步骤配置项
         * @param {boolean} isActive 是否处于激活状态
         * @ignore
         */
        function togglePanel(wizard, config, isActive) {
            var panel = config && config.panel && lib.g(config.panel);

            if (!panel) {
                return;
            }

            var method = isActive ? 'removePartClasses' : 'addPartClasses';
            wizard.helper[method]('panel-hidden', panel);
        }

        /**
         * 节点内容的HTML模板
         *
         * 在模板中可以使用以下占位符：
         *
         * - `{string} text`：文本内容，经过HTML转义
         *
         * @type {string}
         */
        Wizard.prototype.nodeTemplate = '<span>${text}</span>';

        /**
         * 获取节点内容HTML
         *
         * @param {meta.WizardItem} node 节点数据项
         * @return {string} 返回HTML片段
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
         * @param {Wizard} wizard 控件实例
         * @return {string}
         * @ignore
         */
        function getHTML(wizard) {
            var html = '';

            for (var i = 0; i < wizard.steps.length; i++) {
                var node = wizard.steps[i];

                var classes = wizard.helper.getPartClasses('node');
                // 第一步
                if (i === 0) {
                    classes.push.apply(
                        classes,
                        wizard.helper.getPartClasses('node-first')
                    );
                }
                // 最后一步
                if (i === wizard.steps.length - 1 && !wizard.finishText) {
                    classes.push.apply(
                        classes,
                        wizard.helper.getPartClasses('node-last')
                    );
                }

                // 当前步之前的一步
                if (i === wizard.activeIndex - 1) {
                    classes.push.apply(
                        classes,
                        wizard.helper.getPartClasses('node-active-prev')
                    );
                }
                // 已经完成的步骤
                if (i <= wizard.activeIndex - 1) {
                    classes.push.apply(
                        classes,
                        wizard.helper.getPartClasses('node-done')
                    );
                }

                var isActive = i === wizard.activeIndex;
                togglePanel(wizard, node, isActive);
                if (isActive) {
                    classes.push.apply(
                        classes,
                        wizard.helper.getPartClasses('node-active')
                    );
                    if (i === wizard.steps.length - 1) {
                        classes.push.apply(
                            classes,
                            wizard.helper.getPartClasses('node-last-active')
                        );
                    }
                }

                html += '<li class="' + classes.join(' ') + '">';
                html += wizard.getNodeHTML(node);
                html += '</li>';
            }

            if (wizard.finishText) {
                var classes = [].concat(
                    wizard.helper.getPartClasses('node'),
                    wizard.helper.getPartClasses('node-last'),
                    wizard.helper.getPartClasses('node-finish'),
                    wizard.activeIndex === wizard.steps.length
                        ? wizard.helper.getPartClasses('node-active')
                        : []
                );
                html += '<li class="' + classes.join(' ') + '">';
                html += '<span>' + wizard.finishText + '</span>';
                html += '</li>';
            }

            return html;
        }

        var paint = require('./painters');
        /**
         * 渲染自身
         *
         * @method
         * @protected
         * @override
         */
        Wizard.prototype.repaint = paint.createRepaint(
            Control.prototype.repaint,
            {
                /**
                 * @property {meta.WizardItem[]} steps
                 *
                 * 步骤集合
                 */

                /**
                 * @property {string} [finishText]
                 *
                 * “已完成”状态的显示文字，有此属性则在所有步骤后会加一个纯文本节点
                 */
                name: ['steps', 'finishText'],
                paint: function (wizard) {
                    wizard.main.innerHTML = getHTML(wizard);
                }
            },
            {
                /**
                 * @property {number} activeIndex
                 *
                 * 当前步骤节点的下标
                 */
                name: 'activeIndex',
                paint: function (wizard, value) {
                    // 初始化时`steps`的渲染器会处理掉`activeIndex`，不需要这里
                    if (!wizard.helper.isInStage('RENDERED')) {
                        return;
                    }

                    var nodes = wizard.main.getElementsByTagName('li');
                    for (var i = nodes.length - 1; i >= 0; i--) {
                        var isActive = i === wizard.activeIndex;
                        togglePanel(wizard, wizard.steps[i], isActive);

                        var node = nodes[i];
                        var method = isActive
                            ? 'addPartClasses'
                            : 'removePartClasses';
                        wizard.helper[method]('node-active', node);

                        if (i === wizard.steps.length - 1) {
                            wizard.helper[method]('node-last-active', node);
                        }

                        var isDone = i <= (wizard.activeIndex - 1);
                        var method = isDone
                            ? 'addPartClasses'
                            : 'removePartClasses';
                        wizard.helper[method]('node-done', node);

                        var isCurPrev = i === (wizard.activeIndex - 1);
                        var method = isCurPrev
                            ? 'addPartClasses'
                            : 'removePartClasses';
                        wizard.helper[method]('node-active-prev', node);
                    }
                }
            }
        );

        /**
         * 批量设置控件的属性值
         *
         * @param {Object} properties 属性值集合
         * @return {Object} `properties`参数中确实变更了的那些属性
         * @fires enter
         */
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
                /**
                 * @event enter
                 *
                 * 进入某个步骤时触发
                 */
                this.fire('enter');
            }
        };

        /**
         * 获取当前激活的步骤的{@link meta.WizardItem}对象
         *
         * @return {meta.WizardItem}
         */
        Wizard.prototype.getActiveStep = function () {
            return this.get('steps')[this.get('activeIndex')];
        };

        /**
         * 进入下一步
         */
        Wizard.prototype.stepNext = function () {
            var maxStep = this.finishText
                ? this.steps.length
                : this.steps.length - 1;
            if (this.activeIndex < maxStep) {
                this.set('activeIndex', this.activeIndex + 1);
            }
        };

        /**
         * 进入上一步
         */
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
