/**
 * 管理模板引擎实例
 * @file templateEngine.js
 * @author maoquan(maoquan@baidu.com)
 */

define(
    function (require) {
        var etpl = require('etpl');
        var engine;

        return {

            /**
             * 获取一个模板引擎实例
             *
             * @return {Object}
             */
            get: function () {
                if (!engine) {
                    engine = new etpl.Engine();
                }
                return engine;
            },

            /**
             * 设置自定义的模板引擎
             *
             * @param {Object} tplEngine 引擎实例
             */
            set: function (tplEngine) {
                engine = tplEngine;
            }
        };
    }
);
