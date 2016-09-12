/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 标签页控件
 * @author otakustay
 */
define(
    function (require) {
        var eoo = require('eoo');
        var u = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');
        var esui = require('./main');
        var $ = require('jquery');
        var painters = require('./painters');

        /**
         * 标签页控件
         *
         * @extends Control
         * @constructor
         */
        var Tab = eoo.create(
            Control,
            {

                /**
                 * 控件类型，始终为`"Tab"`
                 *
                 * @type {string}
                 * @readonly
                 * @override
                 */
                type: 'Tab',

                /**
                 * 初始化参数
                 *
                 * 如果初始化时未给定{@link Tab#tabs}属性，则按以下规则从DOM中获取：
                 *
                 * 1. 在主元素的子元素中查找存在`data-role="navigator"`属性的元素
                 * 2. 遍历此元素的所有子元素
                 * 3. 将子元素的文本内容属性作为标签的`title`属性
                 * 4. 将子元素的`data-for`属性作为标签的`panel`属性
                 * 5. 将子元素的`class`属性作为标签`classes`属性，用于控制导航标签的样式
                 *
                 * 需要注意的是，此元素仅在初始化时起效果，随后会被移除，
                 * 因此不要依赖此元素上的`id`或者`class`、`style`等属性
                 *
                 * 如果不存在`data-role="navigator"`的元素，则：
                 *
                 * 1. 认为每一个子元素是一个面板
                 * 2. 使用面板的`title`作为标签的`title`属性
                 * 3. 使用面板的`id`作为标签的`panel`属性
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @protected
                 * @override
                 */
                initOptions: function (options) {
                    var properties = {
                        tabs: [],
                        activeIndex: 0,
                        allowClose: false,
                        orientation: 'horizontal',
                        /**
                         * 标签页内容的模板
                         *
                         * 在模板中可以使用以下占位符：
                         *
                         * - `{string} title`：文本内容，经过HTML转义
                         *
                         * @type {string}
                         */
                        contentTemplate: '<span>${title}</span>'
                    };

                    u.extend(properties, options);

                    // 如果子元素中有一个`[data-role="navigator"]`的元素，
                    // 则应该从元素中去找出对应的标签页配置，然后这个元素就不要了，
                    // 控件会自动生成正确的`navigator`格式并放在`main`的最前面
                    //
                    // 而如果有子元素且没有`[data-role="navigator"]`元素，
                    // 同时构造控件的时候没给`tabs`选项，
                    // 则认为每个子元素是一个标签页，从`title`属性中找出对应的`title`
                    var children = $(this.main).children().toArray();
                    if (children.length) {
                        var tabs = [];
                        for (var i = 0; i < children.length; i++) {
                            var element = children[i];
                            if (element.getAttribute('data-role') === 'navigator') {
                                // 在`initOptions`时没有`viewContext`，
                                // 因此不能计算DOM元素的id，
                                // 所以在这里临时保留一下，到`initStructure`里去给id
                                this.navigatorElement = element;
                                // 找到了`[data-role="navigator"]`的元素，抛弃其它配置，
                                // 且这个配置会覆盖用户传入的`tabs`选项
                                properties.tabs = extractTabsFromNavigatorElement(element);

                                break;
                            }
                            else {
                                // 普通元素当作是一个标签页，
                                // 遇到`data-role="navigator"`后会清空配置，
                                // 所以不会影响正确性
                                var config = {
                                    title: element.getAttribute('title'),
                                    panel: element.id
                                };
                                tabs.push(config);
                            }
                        }

                        // 只有用户没给`tabs`（默认为空数组）的时候，才覆盖之，
                        // 如果找到了`[data-role="navigator"]`元素，
                        // 会直接操纵`properties.tabs`，这里不会出现空数组的情况
                        if (!properties.tabs.length) {
                            properties.tabs = tabs;
                        }
                    }

                    this.setProperties(properties);
                },

                /**
                 * 初始化DOM结构
                 *
                 * @protected
                 * @override
                 */
                initStructure: function () {
                    var navigator = this.navigatorElement;
                    this.navigatorElement = null;
                    if (!navigator) {
                        navigator = document.createElement('ul');

                        this.main.insertBefore(navigator, this.main.firstChild || null);
                    }

                    navigator.id = this.helper.getId('navigator');

                    this.helper.addPartClasses('navigator', navigator);
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    this.helper.addDOMEvent('navigator', 'click', 'li', clickTab);
                },

                /**
                 * 获取标签页内容的HTML
                 *
                 * @param {meta.TabItem} config 标签页数据项
                 * @param {boolean} allowClose 是否允许关闭
                 * @return {string} 返回HTML片段
                 */
                getContentHTML: function (config, allowClose) {
                    var contentHtml = '';
                    if (config.url) {
                        contentHtml = '<a href="${url}">${title}</a>';
                    }
                    else {
                        contentHtml = this.contentTemplate;
                    }
                    var html = lib.format(
                        contentHtml,
                        {
                            title: u.escape(config.title),
                            url: u.escape(config.url)
                        }
                    );
                    if (allowClose) {
                        html += '<span class="'
                            + this.helper.getPartClassName('close')
                            + '">关闭</span>';
                    }
                    return html;
                },

                /**
                 * 批量更新属性并重绘
                 *
                 * @param {Object} properties 需更新的属性
                 * @override
                 */
                setProperties: function (properties) {
                    // 如果`tabs`配置变了，则会导致`navigator`整个重新渲染，
                    // 则后续的`repaint`处理`activeIndex`或`allowClose`会产生一次浪费，
                    // 因此这里直接把`activeIndex`放自己身上，等`navigator`渲染后使用，
                    // 不再把`activeIndex`和`allowClose`加入到`changes`集合中去
                    if (properties.tabs) {
                        if (properties.activeIndex == null) {
                            // 如果仅改变`tabs`，则由于标签页的数量变化，
                            // 确认现在激活的标签页是不是还在新的`tabs`中，
                            // 如果不在了，则激活第1个标签
                            var currentActiveTab = properties.tabs[this.activeIndex];
                            var activeIndex = -1;
                            for (var i = 0; i < properties.tabs.length; i++) {
                                if (properties.tabs[i] === currentActiveTab) {
                                    activeIndex = i;
                                    break;
                                }
                            }

                            // 只有当激活的元素变了的时候，才需要触发`activate`事件，
                            // 事件的触发由`properties`里有没有`activeIndex`决定，
                            // 因此如果新的`tabs`中没有原来激活的那个标签，则要触发一下
                            if (activeIndex === -1) {
                                // 为了让基类`setProperties`检测到变化，
                                // 先把`this.activeIndex`改掉
                                this.activeIndex = -1;
                                properties.activeIndex = 0;
                            }
                            else {
                                this.activeIndex = activeIndex;
                            }
                        }

                        // 当`tabs`变化时，整个会重新刷，所以`allowClose`不用加进去
                        if (properties.allowClose != null) {
                            this.allowClose = properties.allowClose;
                            delete properties.allowClose;
                        }
                    }

                    this.$super(arguments);

                    // TODO: 现在的逻辑下，如果`tabs`和`activeIndex`同时变化，
                    // 会导致2次reflow（一次`fillNavigator`，一次`activateTab`），
                    // 看是否还有优化的余地
                },

                /**
                 * 重渲染
                 *
                 * @method
                 * @protected
                 * @override
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    {
                        /**
                         * @property {meta.TabItem[]} tabs
                         *
                         * 标签项配置
                         */

                        /**
                         * @property {boolean} [allowClose=false]
                         *
                         * 是否允许关闭标签
                         */
                        name: ['tabs', 'allowClose'],
                        paint: fillNavigator
                    },
                    {
                        /**
                         * @property {number} activeIndex
                         *
                         * 激活的标签的下标
                         */
                        name: 'activeIndex',
                        paint: activateTab
                    },
                    {
                        /**
                         * @property {string} orientation
                         *
                         * 标签放置的方向，可以使用`horizontal`表示横向放置，
                         * 或使用`vertical`表示纵向放置
                         */
                        name: 'orientation',
                        paint: function (tab, orientation) {
                            tab.removeState('vertical');
                            tab.removeState('horizontal');
                            tab.addState(orientation);
                        }
                    }
                ),

                /**
                 * 激活一个标签页
                 *
                 * 如果不幸有多个标签对应的是同一个{@link meta.TabItem}配置项，则会激活最后一个
                 *
                 * @param {meta.TabItem} config 标签页的配置对象
                 * @fires activate
                 */
                activate: function (config) {
                    for (var i = 0; i < this.tabs.length; i++) {
                        if (this.tabs[i] === config) {
                            this.set('activeIndex', i);
                        }
                    }
                },

                /**
                 * 添加一个标签页
                 *
                 * @param {meta.TabItem} config 标签页的配置
                 * @fires add
                 */
                add: function (config) {
                    this.insert(config, this.tabs.length);
                },

                /**
                 * 在指定位置添加一个标签页
                 *
                 * @param {meta.TabItem} config 标签页的配置
                 * @param {number} index 插入的位置，
                 * 如果小于0则会插入到最前面，大于当前标签数量则插入到最后面
                 * @fires add
                 */
                insert: function (config, index) {
                    index = Math.min(index, this.tabs.length);
                    index = Math.max(index, 0);

                    this.tabs.splice(index, 0, config);
                    // 新加的标签页不可能是激活状态的，唯一的例外下面会覆盖到
                    var tabElement = createTabElement(this, config, false, this.allowClose);
                    var navigator = this.helper.getPart('navigator');
                    var children = $(navigator).children().toArray();
                    navigator.insertBefore(
                        tabElement, children[index] || null);

                    // 如果原来是没有标签页的，则新加的这个默认激活
                    if (this.tabs.length === 1) {
                        this.activeIndex = 0;
                        activateTab(this, 0);
                    }
                    else {
                        // 如果在当前激活的标签前面插入一个，则`activeIndex`需要变化，
                        // 但视图是不用刷新的
                        if (index <= this.activeIndex) {
                            this.activeIndex++;
                        }

                        // 新加入的标签默认要隐藏起来
                        if (config.panel) {
                            var panel = lib.g(config.panel);
                            if (panel) {
                                panel.style.display = 'none';
                            }
                        }
                    }

                    /**
                     * @event add
                     *
                     * 添加标签时触发
                     *
                     * @param {number} activeIndex 添加的下标
                     * @param {meta.TabItem} tab 添加的标签数据项
                     */
                    this.fire('add', {tab: config, index: index});
                },

                /**
                 * 移除一个标签页
                 *
                 * @param {meta.TabItem} config 标签页的配置
                 * @fires remove
                 */
                remove: function (config) {
                    // 这里使用`while`是解决`this.tabs`在嵌套循环里被修改带来的问题
                    // 若这里使用`for`循环来处理，则会因为`removeAt`里
                    // 直接`this.tabs.slice`而发生的变量不同步错误
                    // 此坑很隐晦，修改需谨慎
                    var index = 0;
                    while ((index = u.indexOf(this.tabs, config, index)) >= 0) {
                        this.removeAt(index);
                    }
                },

                /**
                 * 根据下标移除一个标签页
                 *
                 * @param {number} index 需要移除的标签页的下标
                 * @fires remove
                 */
                removeAt: function (index) {
                    var removed = this.tabs.splice(index, 1)[0];
                    var navigator = this.helper.getPart('navigator');
                    if (removed) {
                        var children = $(navigator).children().toArray();
                        var tabElement = children[index];
                        tabElement.parentNode.removeChild(tabElement);

                        // 如果删的标签在当前激活的标签的前面，
                        // 则当前激活的标签的下标其实改变了，`activeIndex`是要调整的，
                        // 但这种情况下实际激活的还是同一个标签，不用重新渲染
                        if (index < this.activeIndex) {
                            this.activeIndex--;
                        }
                        // 如果正好激活的标签被删了，则把激活标签换成当前的后一个，
                        // 如果没有后一个了，则换成最后一个，这需要重新渲染
                        else if (index === this.activeIndex) {
                            // 由于可能`activeIndex`没变，因此不能走`setProperties`流程
                            this.activeIndex = Math.min(
                                this.activeIndex,
                                this.tabs.length - 1
                            );
                            activateTab(this, this.activeIndex);
                        }

                        // 隐藏对应的元素
                        if (removed.panel) {
                            var panel = lib.g(removed.panel);
                            if (panel) {
                                panel.style.display = 'none';
                            }
                        }

                        /**
                         * @event remove
                         *
                         * 移除标签时触发
                         *
                         * @param {number} activeIndex 移除的下标
                         * @param {meta.TabItem} tab 移除的标签数据项
                         */
                        this.fire('remove', {tab: removed, index: index});
                    }
                },

                /**
                 * 获取当前激活的{@link meta.TabItem}对象
                 *
                 * @return {meta.TabItem}
                 */
                getActiveTab: function () {
                    return this.get('tabs')[this.get('activeIndex')];
                },

                /**
                 * 修改指定Tab标题
                 *
                 * @param {string} panelId tab对应的panelId
                 * @param {string} title 新标题
                 */
                updateTabTitle: function (panelId, title) {
                    var tabTitle = getTabTitle.call(this, panelId);
                    tabTitle.innerHTML = this.getContentHTML({title: title}, this.allowClose);
                }
            }
        );


        /**
         * 从存在`data-role="navigator"`属性的元素元素中抽取tab配置信息
         *
         * 1. 遍历此元素的所有子元素
         * 2. 将子元素的文本内容属性作为标签的`title`属性
         * 3. 将子元素的`data-for`属性作为标签的`panel`属性
         * 4. 将子元素的`class`属性作为标签`classes`属性，用于控制导航标签的样式
         *
         * @param {Element} element dom元素
         * @return {Object}
         * @ignore
         */
        function extractTabsFromNavigatorElement(element) {
            var tabs = [];
            var children = $(element).children().toArray();

            for (var i = 0; i < children.length; i++) {
                var tab = children[i];
                var config = {
                    title: $(tab).text(),
                    panel: $(tab).attr('data-for'),
                    url: $(tab).attr('data-url')
                };

                if (tab.className) {
                    config.classes = tab.className.split(/\s+/);
                }

                tabs.push(config);
            }

            return tabs;
        }

        /**
         * 点击某个标签时的切换逻辑
         *
         * @param {Event} e 触发事件的事件对象
         * @ignore
         */
        function clickTab(e) {
            var target = e.target;
            var tabElement = e.currentTarget;

            var $children = $(tabElement).parent().children();
            var idx = $children.index(tabElement);

            if (this.helper.isPart(target, 'close')) {
                this.removeAt(idx);
            }
            else {
                this.set('activeIndex', idx);
            }
        }

        /**
         * 创建一个标签元素
         *
         * @param {Tab} tab 控件实例
         * @param {meta.TabItem} config 标签页的配置数据项
         * @param {boolean} isActive 是否自激活状态
         * @param {boolean} allowClose 是否允许关闭
         * @return {Element}
         * @ignore
         */
        function createTabElement(tab, config, isActive, allowClose) {
            var element = document.createElement('li');

            tab.helper.addPartClasses('item', element);

            if (config.classes) {
                $(element).addClass(config.classes.join(' '));
            }

            if (isActive) {
                tab.helper.addPartClasses('item-active', element);
            }

            element.id = tab.helper.getId('tab-title-for-panel-' + config.panel);

            element.innerHTML = tab.getContentHTML(config, allowClose);

            return element;
        }

        /**
         * 获取指定的tab标题元素
         *
         * @param {string} panelId 指定的panelId
         * @return {Element}
         * @ignore
         */
        function getTabTitle(panelId) {
            return lib.g(this.helper.getId('tab-title-for-panel-' + panelId));
        }

        /**
         * 获取导航条的HTML
         *
         * @param {Tab} tab Tab控件实例
         * @ignore
         */
        function fillNavigator(tab) {
            var navigator = tab.helper.getPart('navigator');
            var parentNode = navigator.parentNode;
            var placeholder = navigator.nextSibling;
            navigator.innerHTML = '';
            navigator.parentNode.removeChild(navigator);

            for (var i = 0; i < tab.tabs.length; i++) {
                var config = tab.tabs[i];
                var isActive = tab.activeIndex === i;
                var tabElement = createTabElement(tab, config, isActive, tab.allowClose);
                navigator.appendChild(tabElement);
            }

            parentNode.insertBefore(navigator, placeholder);
        }

        /**
         * 激活指定位置的标签页
         *
         * @param {Tab} tab Tab控件实例
         * @param {number} index 待激活的标签页的下标
         * @ignore
         */
        function activateTab(tab, index) {
            for (var i = 0; i < tab.tabs.length; i++) {
                var config = tab.tabs[i];

                if (config.panel) {
                    var panel = lib.g(config.panel);
                    if (panel) {
                        panel.style.display = i === index ? '' : 'none';
                    }
                }

                var navigator = tab.helper.getPart('navigator');
                var children = $(navigator).children().toArray();
                var tabElement = children[i];
                var methodName = i === index ? 'addPartClasses' : 'removePartClasses';
                tab.helper[methodName]('item-active', tabElement);
            }

            var event = {
                activeIndex: index,
                tab: tab.tabs[index]
            };

            /**
             * @event activate
             *
             * 一个标签从未激活状态变为激活状态时触发
             *
             * @param {number} activeIndex 激活的下标
             * @param {meta.TabItem} tab 激活的标签数据项
             * @member Tab
             */
            tab.fire('activate', event);
        }

        esui.register(Tab);
        return Tab;
    }
);
