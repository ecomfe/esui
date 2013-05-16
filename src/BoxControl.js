define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');

        function updateTitle( box ) {
            var title = box.title 
                || box.main.title 
                || ( box.getValue() === 'on' ? '' : box.getValue());
            lib.g(helper.getId(box, 'label')).innerHTML = lib.encodeHTML(title);
        }

        /**
         * 同步选中状态
         *
         * @param {BoxControl} box 控件实例
         * @param {Event} e DOM事件对象
         */
        function syncChecked(box, e) {
            var checked = lib.g(helper.getId(box, 'box')).checked;
            box.setProperties({ checked: checked });
        }

        /**
         * 选择框控件基类
         * 
         * @description 不直接使用，供CheckBox和Radio继承
         * @param {Object} options 控件初始化参数
         */
        function BoxControl( options ) {
            InputControl.apply( this, arguments );
        }

        BoxControl.prototype = {
            /**
             * 创建控件主元素
             *
             * @protected
             * @return {HTMLInputElement}
             */
            createMain: function () {
                return document.createElement('div');
            },

            initOptions: function (options) {
                var properties = {
                    value: 'on',
                    checked: false
                };

                lib.extend(properties, options);

                properties.name = 
                    properties.name || this.main.getAttribute('name');

                // 初始可以有一个`datasource`，用来判断一开始是否选中，
                // 这个属性只能用一次，且不会保存下来
                // 
                // `datasource`可以是以下类型：
                // 
                // - 数组：此时只要`rawValue`在`datasource`中（弱等比较）则选上
                // - 其它：只要`rawValue`与此相等（弱等比较）则选上
                var datasource = properties.datasource;
                delete properties.datasource;

                // 这里涉及到`value`和`rawValue`的优先级问题，
                // 而这个处理在`InputControl.prototype.setProperties`里，
                // 因此要先用一下，然后再管`datasource`
                this.setProperties(properties);
                if (datasource != null) {
                    if (lib.isArray(datasource)) {
                        for (var i = 0; i < datasource.length; i++) {
                            if (datasource[i] == this.value) {
                                this.checked = true;
                                break;
                            }
                        }
                    }
                    else if (this.rawValue == datasource) {
                        this.checked = true;
                    }
                }

                if (!this.title) {
                    this.title = this.main.title
                        || ( this.getValue() === 'on' ? '' : this.getValue() );
                }
            },
            
            /**
             * 渲染控件
             *
             * @public
             */
            initStructure: function () {
                // 如果用的是一个`<input>`，替换成`<div>`
                if (this.main.nodeName.toLowerCase() === 'input') {
                    var main = this.createMain();
                    lib.insertBefore(main, this.main);
                    lib.removeNode(this.main);
                    this.main = main;
                }

                var html = '<input type="${type}" name="${name}" id="${id}" />'
                    + '<label for="${id}" id="${labelId}"></label>';
                this.main.innerHTML = lib.format(
                    html,
                    {
                        type: this.type,
                        name: this.name,
                        id: helper.getId(this, 'box'),
                        labelId: helper.getId(this, 'label')
                    }
                );

                helper.addDOMEvent(
                    this, 
                    this.main, 
                    'click', 
                    lib.bind(this.fire, this, 'click')
                );

                helper.addDOMEvent(
                    this,
                    this.main,
                    'change',
                    lib.curry(syncChecked, this)
                );
            },

            repaint: helper.createRepaint(
                {
                    name: ['rawValue', 'checked'],
                    paint: function (box, rawValue, checked) {
                        var value = box.stringifyValue(rawValue);
                        var box = lib.g(helper.getId(box, 'box'));
                        box.value = value;
                        box.checked = checked;
                    }
                },
                {
                    name: 'title',
                    paint: updateTitle
                }
            ),

            /**
             * 设置选中状态
             * 
             * @public
             * @param {boolean} checked 状态
             */
            setChecked: function ( checked ) {
                this.setProperties({ checked: checked });
            },
            
            /**
             * 获取选中状态
             * 
             * @public
             * @return {boolean}
             */
            isChecked: function () {
                return this.checked;
            }
        };

        lib.inherits( BoxControl, InputControl );

        return BoxControl;
    }
);