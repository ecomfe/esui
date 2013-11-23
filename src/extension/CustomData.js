/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 自定义数据扩展
 * @author otakustay
 */
define(
    function (require) {
        var Extension = require('../Extension');

        /**
         * 供控件声明和获取自定义数据的扩展
         *
         * 该扩展会收集控件上以**data**开头且后面跟大写字符或数字的属性，
         * 并为控件加上`getData`和`setData`来读写数据
         * 
         * 使用该扩展后，可在HTML中声明一些自定义属性，
         * 并在后续通过javascript从控件的实例上获取
         *
         *     <div data-ui-type="Button" 
         *         data-ui-id="submitButton"
         *         data-ui-data-auth="admin"
         *         data-ui-extension-data-type="CustomData">提交</div>
         *     <script>
         *         var esui = require('esui');
         *         esui.init(document.body);
         *         var button = esui.get('submitButton');
         *         if (button.getData('auth') !== currentUser.role) {
         *             button.hide();
         *         }
         *     </script>
         *
         * @class extension.CustomData
         * @extends Extension
         * @constructor
         */
        function CustomData() {
            Extension.apply(this, arguments);
        }

        /**
         * 指定扩展类型，始终为`"CustomData"`
         *
         * @type {string}
         */
        CustomData.prototype.type = 'CustomData';

        var dataProperty = /^data[A-Z0-9]/;

        /**
         * 激活扩展
         *
         * @override
         */
        CustomData.prototype.activate = function () {
            Extension.prototype.activate.apply(this, arguments);
            var data = this.target.data;
            if (typeof data !== 'object') {
                data = require('../main').parseAttribute(this.target.data);
            }
            for (var key in this.target) {
                if (this.target.hasOwnProperty(key) && dataProperty.test(key)) {
                    var dataKey = key.charAt(4).toLowerCase() + key.slice(5);
                    data[dataKey] = this.target[key];
                }
            }

            this.target.getData = function (key) {
                return data[key];
            };

            this.target.setData = function (key, value) {
                data[key] = value;
            };
        };

        /**
         * 取消扩展的激活状态
         *
         * @override
         */
        CustomData.prototype.inactivate = function () {
            Extension.prototype.inactivate.apply(this, arguments);

            delete this.target.getData;
            delete this.target.setData;
        };

        require('../lib').inherits(CustomData, Extension);
        require('../main').registerExtension(CustomData);

        return CustomData;
    }
);
