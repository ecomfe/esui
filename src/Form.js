define(
    function (require) {
        var lib = require('./lib');
        var Panel = require('./Panel');

        /**
         * 表单控件
         *
         * @param {Object=} options 构造控件的选项
         * @constructor
         */
        function Form(options) {
            Panel.apply(this, arguments);
        }

        Form.prototype.type = 'Form';

        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @protected
         */
        Form.prototype.createMain = function (options) {
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = options.action;
            return form;
        };

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @protected
         */
        Form.prototype.initOptions = function (options) {
            var properties = {};
            lib.extend(properties, options);
            properties.tagName = 'form';
            Panel.prototype.initOptions.call(this, properties);
            this.action = this.main.getAttribute('action');
        };

        var InputControl = require('./InputControl');

        function collect(control, store) {
            if (control instanceof InputControl) {
                var name = control.get('name');
                var value = control.getRawValue();
                if (store.hasOwnProperty(name)) {
                    store[name] = [].concat(store[name], value);
                }
                else {
                    store[control.name] = value;
                }
            }
            for (var i = 0; i < control.children.length; i++) {
                collect(control.children[i], store);
            }
        }

        /**
         * 获取表单数据，形成以`name`为键，`rawValue`为值的对象，
         * 如果有同`name`的多个控件，则值为数组
         *
         * @param {Object} 表单的数据
         * @public
         */
        Form.prototype.getData = function () {
            var store = {};
            collect(this, store);
            return store;
        };

        function collectInputControls(control, name, type, store) {
            if (control instanceof InputControl
                && control.get('name') === name
                && (!type || control.type === type)
            ) {
                store.push(control);
            }

            for (var i = 0; i < control.children.length; i++) {
                collectInputControls(control, name, type, store);
            }
        }

        /**
         * 根据名称及可选的类型获取输入控件
         *
         * @param {string} name 控件的name属性
         * @param {string=} type 控件的类型
         * @return {Array.<Control>}
         * @public
         */
        Form.prototype.getInputControlsByName = function (name, type) {
            var store = [];
            collectInputControls(this, name, type, store);
            return store;
        };

        lib.inherits(Form, Panel);
        require('./main').register(Form);
        return Form;
    }
);