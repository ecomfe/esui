define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        /**
         * 标签页控件
         *
         * @param {Object=} options 构造控件的选项
         * @constructor
         */
        function Tab(options) {
            Control.apply(this, arguments);
        }

        Tab.prototype.type = 'Tab';

        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @protected
         */
        Tab.prototype.createMain = function (options) {
            return document.createElement('div');
        };

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @protected
         */
        Tab.prototype.initOptions = function (options) {
            var properties = {
                tabs: [],
                activeIndex: 0,
                allowClose: false
            };
            lib.extend(properties, options);

            // 如果子元素中有一个`[data-role="navigator"]`的元素，
            // 则应该从元素中去找出对应的标签页配置，然后这个元素就不要了，
            // 控件会自动生成正确的`navigator`格式并放在`main`的最前面
            // 
            // 而如果有子元素且没有`[data-role="navigator"]`元素，
            // 同时构造控件的时候没给`tabs`选项，
            // 则认为每个子元素是一个标签页，从`title`属性中找出对应的`title`
            if (this.main.children.length) {
                var tabs = [];
                for (var i = 0; i < this.main.children.length; i++) {
                    var element = this.main.children[i];
                    if (element.getAttribute('data-role') === 'navigator') {
                        // 找到了`[data-role="navigator"]`的元素，抛弃其它配置，
                        // 且这个配置会覆盖用户传入的`tabs`选项
                        properties.tabs = [];
                        element.id = helper.getId(this, 'navigator');
                        for (var i = 0; i < element.children.length; i++) {
                            var tab = element.children[i];
                            var config = {
                                title: lib.getText(tab),
                                panel: tab.getAttribute('data-for')
                            };
                            properties.tabs.push(config);
                        }
                        break;
                    }
                    else {
                        // 普通元素当作是一个标签页，
                        // 遇到`data-role="navigator"]`后会清空配置，
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
            lib.extend(this, properties);
        };

        /*
         * 点击某个标签时的切换逻辑
         *
         * @param {Tab} tab Tab控件实例
         * @param {Event} e 触发事件的事件对象
         */
        function clickTab(tab, e) {
            var target = e.target;
            var tabElement = target;
            while (tabElement.nodeName.toLowerCase() !== 'li') {
                tabElement = tabElement.parentNode;
            }

            if (tabElement.nodeName.toLowerCase() === 'li') {
                var parent = tabElement.parentNode;
                for (var i = 0; i < parent.children.length; i++) {
                    if (parent.children[i] === tabElement) {
                        // 如果点在关闭区域上，则移除这个元素，
                        // 其它情况为激活该元素
                        if (lib.hasClass(target, 'ui-tab-close')) {
                            tab.removeAt(i);
                        }
                        else {
                            tab.activateAt(i);
                        }
                        return;
                    }
                }
            }
        }

        /**
         * 初始化DOM结构
         *
         * @protected
         */
        Tab.prototype.initStructure = function () {
            var navigator = lib.g(helper.getId(this, 'navigator'));
            if (!navigator) {
                navigator = document.createElement('ul');
                navigator.id = helper.getId(this, 'navigator');

                this.main.insertBefore(navigator, this.main.firstChild || null);
            }

            require('./controlHelper').addDOMEvent(
                this, navigator, 'click', lib.bind(clickTab, null, this));
        };

        /**
         * 创建一个标签元素
         *
         * @param {Object} config 标签页的配置
         * @param {string} config.title 标签页的标题
         * @param {boolean} isActive 是否自激活状态
         * @param {boolean} allowClose 是否允许关闭
         */
        function createTabElement(config, isActive, allowClose) {
            var tab = document.createElement('li');

            if (isActive) {
                lib.addClass(tab, 'ui-tab-active');
            }

            tab.innerHTML += lib.encodeHTML(config.title);

            if (allowClose) {
                tab.innerHTML += '<span class="ui-tab-close">关闭</span>';
            }

            return tab;
        } 

        /**
         * 获取导航条的HTML
         *
         * @param {Tab} tab Tab控件实例
         * @inner
         */
        function fillNavigator(tab) {
            var navigator = lib.g(helper.getId(tab, 'navigator'));
            var parentNode = navigator.parentNode;
            var placeholder = navigator.nextSibling;
            navigator.innerHTML = '';
            navigator.parentNode.removeChild(navigator);

            for (var i = 0; i < tab.tabs.length; i++) {
                var config = tab.tabs[i];
                var isActive = tab.activeIndex === i;
                var tabElement = 
                    createTabElement(config, isActive, tab.allowClose);
                navigator.appendChild(tabElement);
            }

            parentNode.insertBefore(navigator, placeholder);
        }

        /**
         * 批量更新属性并重绘
         *
         * @param {Object} 需更新的属性
         * @public
         */
        Tab.prototype.setProperties = function (properties) {
            // 如果`tabs`配置变了，则会导致`navigator`整个重新渲染，
            // 则后续的`repaint`处理`activeIndex`或`allowClose`会产生一次浪费，
            // 因此这里直接把`activeIndex`放自己身上，等`navigator`渲染后使用，
            // 不再把`activeIndex`和`allowClose`加入到`changes`集合中去
            if (properties.tabs) {
                if (properties.activeIndex != null) {
                    this.activeIndex = properties.activeIndex;
                    delete properties.activeIndex;
                }
                else {
                    // 如果仅改变`tabs`，则由于标签页的数量变化，
                    // 可能导致`activeIndex`不同步，需要同步一次
                    // 
                    // 仅在这里做分支，是因为如果用户传递`activeIndex`，
                    // 应该由用户保证正确性，出错也能及时让开发者发现
                    if (this.activeIndex >= properties.tabs.length) {
                        this.activeIndex = 0;
                    }
                }

                if (properties.allowClose != null) {
                    this.allowClose = properties.allowClose;
                    delete properties.allowClose;
                }
            }

            Control.prototype.setProperties.apply(this, arguments);
        };

        /*
         * 激活指定位置的标签页
         *
         * @param {Tab} tab Tab控件实例
         * @parma {number} index 待激活的标签页的下标
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

                var navigator = lib.g(helper.getId(tab, 'navigator'));
                var tabElement = navigator.children[i];
                var methodName = i === index ? 'addClass' : 'removeClass';
                lib[methodName](tabElement, 'ui-tab-active');
            }

            var event = {
                activeIndex: index,
                tab: tab.tabs[index]
            };
            tab.fire('activate', event);
        }

        // 默认情况下只要处理了`tabs`就啥都处理完了
        var allProperties = [
            { name: 'tabs' }
        ];

        /**
         * 重绘
         *
         * @param {Array=} 更新过的属性集合
         * @protected
         */
        Tab.prototype.repaint = function (changes) {
            changes = changes || allProperties;

            for (var i = 0; i < changes.length; i++) {
                var record = changes[i];
                if (record.name === 'tabs') {
                    fillNavigator(this);
                    // `tabs`变化导致`navigator`重新渲染，
                    // 同时`activeIndex`的变化会被`setProperties`吞掉，
                    // 因此要同步一次
                    activateTab(this, this.activeIndex);
                }
                else if (record.name === 'activeIndex') {
                    activateTab(this, this.activeIndex);
                }
                else if (record.name === 'allowClose') {
                    fillNavigator(this);
                }
            }
        };

        /**
         * 激活一个标签页
         *
         * @param {Object} config 标签页的配置对象
         * @public
         */
        Tab.prototype.activate = function (config) {
            for (var i = 0; i < this.tabs.length; i++) {
                if (this.tabs[i] === config) {
                    this.activateAt(i);
                }
            }
        };

        /**
         * 激活指定位置的标签页
         *
         * @param {number} index 待激活的标签页的下标
         * @public
         */
        Tab.prototype.activateAt = function (index) {
            this.setProperties({ activeIndex: index });
        };

        /**
         * 添加一个标签页
         *
         * @param {Object} config 标签页的配置
         * @param {string} config.title 标签页的标题
         * @param {string=} config.panel 标签页对应的容器的id
         */
        Tab.prototype.add = function (config) {
            this.insert(config, this.tabs.length);
        };

        /**
         * 在指定位置添加一个标签页
         *
         * @param {Object} config 标签页的配置
         * @param {string} config.title 标签页的标题
         * @param {string=} config.panel 标签页对应的容器的id
         */
        Tab.prototype.insert = function (config, index) {
            this.tabs.splice(index, 0, config);
            // 新加的标签页不可能是激活状态的，唯一的例外下面会覆盖到
            var tabElement = createTabElement(config, false, this.allowClose);
            var navigator = lib.g(helper.getId(this, 'navigator'));
            navigator.insertBefore(
                tabElement, navigator.children[index] || null);

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

            this.fire('add', { tab: config, index: index });
        };

        /**
         * 移除一个标签页
         *
         * @param {Object} config 标签页的配置
         */
        Tab.prototype.remove = function (config) {
            for (var i = 0; i < this.tabs.length; i++) {
                if (this.tabs[i] === config) {
                    this.removeAt(i);
                }
            }
        };

        /**
         * 根据下标移除一个标签页
         *
         * @param {number} index 需要移除的标签页的下标
         */
        Tab.prototype.removeAt = function (index) {
            var removed = this.tabs.splice(index, 1);
            var navigator = lib.g(helper.getId(this, 'navigator'));
            if (removed.length) {
                var tabElement = navigator.children[index];
                tabElement.parentNode.removeChild(tabElement);

                // 如果删的标签在当前激活的标签的前面，
                // 则当前激活的标签的下标其实改变了，`activeIndex`是要调整的，
                // 但这种情况下实际激活的还是同一个标签，不用重新渲染
                if (index < this.activeIndex) {
                    this.activeIndex--;
                }

                // 如果正好激活的标签被删了，则把激活标签换成当前的后一个，
                // 如果没有后一个了，则换成最后一个，这需要重新渲染
                if (index === this.activeIndex) {
                    // 由于可能`activeIndex`没变，因此不能走`setProperties`流程
                    this.activeIndex = Math.min(
                        this.activeIndex, 
                        this.tabs.length - 1
                    );
                    activateTab(this, this.activeIndex);
                }
                this.fire('remove', { tab: removed[0], index: index });
            }
        };

        // TODO: 添加`allowClose`属性的控制

        lib.inherits(Tab, Control);
        require('./main').register(Tab);
        return Tab;
    }
);