/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file mouseproxy 继承于jquery ui的mouse widget。
 * 让使用者可以直接受用mousestart等操作。
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {
        var $ = require('jquery');
        require('./jquery-ui');

        /* eslint-disable fecs-camelcase */
        $.widget('ui.mouse', $.ui.mouse, {
            options: {},
            _create: function () {
                this._mouseInit();
            },
            _mouseStart: function (event) {
                this._trigger('start', event);
            },
            _mouseDrag: function (event) {
                this._trigger('drag', event);
            },
            _mouseStop: function (event) {
                this._trigger('stop', event);
            }
        });
        /* eslint-enable fecs-camelcase */
    }
);
