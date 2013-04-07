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
                tabs: []
            };
            var lib = require('./lib');
            lib.extend(properties, options);

            // 如果子元素中有一个`[data-role="navigator"]`的元素，
            // 则应该从元素中去找出对应的标签页。
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
                        // 同时认为`navigator`元素已经有了，
                        // 不用在`initStructure`中再次创建
                        properties.navigator = element;
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

        /**
         * 初始化DOM结构
         *
         * @protected
         */
        Tab.prototype.initStructure = function () {
            if (this.navigator) {
                return;
            }

            this.navigator = document.createElement('ul');

            var itemTemplate = '<li data-for="${panel}">${title}</li>';
            var html = '';
            var lib = require('./lib');
            for (var i = 0; i < this.tabs.length; i++) {
                var config = this.tabs[i];
                var data = {
                    panel: lib.encodeHTML(config.panel),
                    title: lib.encodeHTML(config.title)
                };
                html += lib.format(itemTemplate, data);
            }

            this.navigator.innerHTML = itemTemplate;
            lib.insertBefore(this.navigator, this.main.firstChild);
        };

        /**
         * 添加一个标签页
         *
         * @param {Object} config 标签页的配置
         * @param {string} config.title 标签页的标题
         * @param {string=} config.panel 标签页对应的容器的id
         */
        Tab.prototype.add = function (config) {
            // TODO: 实现之
        };

        /**
         * 移除一个标签页
         *
         * @param {Object} config 标签页的配置
         */
        Tab.prototype.remove = function (config) {
            // TODO: 实现之
        };

        /**
         * 根据下标移除一个标签页
         *
         * @param {number} index 需要移除的标签页的下标
         */
        Tab.prototype.removeAt = function (index) {
            // TODO: 实现之
        };

        // TODO: 添加`allowClose`属性的控制

        require('./lib').inherits(Tab, Control);
        require('./main').register(Tab);
        return Tab;
    }
);