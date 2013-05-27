define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');

        function updateTitle( box ) {
            var title = box.title 
                || box.main.title 
                || ( box.getValue() === 'on' ? '' : box.getValue());
            title = lib.encodeHTML(title);
            lib.g(helper.getId(box, 'label')).innerHTML = title;
            lib.g(box.boxId).setAttribute('title', title);
        }

        /**
         * 同步选中状态
         *
         * @param {CheckBox} box 控件实例
         * @param {Event} e DOM事件对象
         */
        function syncChecked(box, e) {
            var checked = lib.g(box.boxId).checked;
            box.setProperties({ checked: checked });
        }

        /**
         * 复选框控件
         * 
         * @param {Object} options 控件初始化参数
         */
        function CheckBox( options ) {
            InputControl.apply( this, arguments );
        }

        CheckBox.prototype = {
            type: 'CheckBox',

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
                    this.boxId = this.main.id || helper.getId(this, 'box');
                    helper.replaceMain(this);
                }
                else {
                    this.boxId = helper.getId(this, 'box');
                }

                var html = '<input type="checkbox" name="${name}" id="${id}" />'
                    + '<label for="${id}" id="${labelId}"></label>';
                this.main.innerHTML = lib.format(
                    html,
                    {
                        name: this.name,
                        id: this.boxId,
                        labelId: helper.getId(this, 'label')
                    }
                );

                var box = lib.g(helper.getId(this, 'box'));
                helper.addDOMEvent(
                    this, 
                    box, 
                    'click', 
                    function () { this.fire('click'); }
                );

                helper.addDOMEvent(
                    this,
                    box,
                    'change',
                    lib.curry(syncChecked, this)
                );
            },

            setProperties: function (properties) {
                var changes = 
                    InputControl.prototype.setProperties.apply(this, arguments);
                if (changes.hasOwnProperty('checked')) {
                    this.fire('change');
                }
            },

            repaint: helper.createRepaint(
                InputControl.prototype.repaint,
                {
                    name: ['rawValue', 'checked'],
                    paint: function (box, rawValue, checked) {
                        var value = box.stringifyValue(rawValue);
                        var box = lib.g(box.boxId);
                        box.value = value;
                        box.checked = checked;
                    }
                },
                {
                    name: ['disabled', 'readOnly'],
                    paint: function (box, disabled, readOnly) {
                        var box = lib.g(box.boxId);
                        box.disabled = disabled;
                        box.readOnly = readOnly;
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
                if (helper.isInStage(this, 'RENDERED')) {
                    var box = lib.g(helper.getId(this, 'box'));
                    return box.checked;
                }
                else {
                    return this.checked;
                }
            }
        };

        lib.inherits( CheckBox, InputControl );
        require('./main').register(CheckBox);
        return CheckBox;
    }
);