define(
    function (require) {
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
            var lib = require('./lib');
            lib.extend(properties, options);

            // 如果子元素中有一个`[data-role="navigator"]`的元素，
            // 则应该从元素中去找出对应的标签页配置，然后这个元素就不要了，
            // 控件会自动生成正确的`navigator`格式并放在`main`的最前面
            // 
            // 而如果有子元素且没有`[data-role="navigator"]`元素，
            // 则认为每个子元素是一个标签页，从`title`属性中找出对应的`title`
            if (this.main.children.length) {
                properties.tabs = [];
                for (var i = 0; i < this.main.children.length; i++) {
                    var element = this.main.children[i];
                    if (element.getAttribute('data-role') === 'navigator') {
                        // 找到了`[data-role="navigator"]`的元素，抛弃其它配置
                        properties.tabs = [];
                        element.parentNode.removeChild(element);
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
                        properties.tabs.push(config);
                    }
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
        function selectTab(tab, e) {
            var target = e.target;
            while (target.nodeName.toLowerCase() !== 'li') {
                target = target.parentNode;
            }

            if (target.nodeName.toLowerCase() === 'li') {
                var parent = target.parentNode;
                for (var i = 0; i < parent.children.length; i++) {
                    if (parent.children[i] === target) {
                        tab.activateAt(i);
                    }
                    return;
                }
            }
        }

        /**
         * 初始化DOM结构
         *
         * @protected
         */
        Tab.prototype.initStructure = function () {
            this.navigator = document.createElement('ul');

            var lib = require('./lib');
            this.main.insertBefore(this.navigator, this.main.firstChild);

            require('./controlHelper').addDOMEvent(
                this, this.navigator, 'click', lib.bind(selectTab, null, this));
        };

        /**
         * 获取导航条的HTML
         *
         * @param {Array} tabs 标签页配置项
         * @inner
         */
        function getNavigatorHTML(tabs) {
            var itemTemplate = '<li data-for="${panel}">${title}</li>';
            var html = '';
            var lib = require('./lib');
            for (var i = 0; i < tabs.length; i++) {
                var config = tabs[i];
                var data = {
                    panel: lib.encodeHTML(config.panel),
                    title: lib.encodeHTML(config.title)
                };
                html += lib.format(itemTemplate, data);
            }

            return html;
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
                var lib = require('./lib');

                if (config.panel) {
                    var panel = lib.g(config.panel);
                    if (panel) {
                        panel.style.display = i === index ? '' : 'none';
                    }
                }

                var tabElement = tab.navigator.children[i];
                var methodName = i === index ? 'addClass' : 'removeClass';
                lib[methodName](tabElement, 'ui-tab-active');
            }
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
                    this.navigator.innerHTML = getNavigatorHTML(this.tabs);
                    // `tabs`变化导致`navigator`重新渲染，
                    // 同时`activeIndex`的变化会被`setProperties`吞掉，
                    // 因此要同步一次
                    activateTab(this, this.activeIndex);
                }
                else if (record.name === 'activeIndex') {
                    activateTab(this, this.activeIndex);
                }
                else if (record.name === 'allowClose') {
                    // TODO: 实现allowClose
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
            // 因为可以从已有的HTML中找出`navigator`，
            // 所以鬼知道用户用的是`ul`还是`div`，
            // 为了避免破坏内容模型，这里进行一下容器元素的判断
            var tabElement = document.createElement('li');
            var lib = require('./lib');
            tabElement.innerHTML = lib.encodeHTML(config.title);
            this.navigator.insertBefore(
                tabElement, this.navigator.children[index]);

            // 如果在当前激活的标签前插入一个，则`activeIndex`需要变化，
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
            if (removed.length) {
                var tabElement = this.navigator.children[index];
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
            }
        };

        // TODO: 添加`allowClose`属性的控制

        require('./lib').inherits(Tab, Control);
        require('./main').register(Tab);
        return Tab;
    }
);