/**
 * mini-event
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 入口
 * @author otakustay
 */
define(
    function (require) {
        var Event = require('./Event');

        /**
         * @class main
         * @singleton
         */
        return {
            /**
             * 版本号
             *
             * @type {string}
             */
            version: '0.9.0',

            /**
             * {@link Event}类
             *
             * @type {Function}
             */
            Event: Event,

            /**
             * 参考{@link Event#fromDOMEvent}
             */
            fromDOMEvent: Event.fromDOMEvent,

            /**
             * 参考{@link Event#fromEvent}
             */
            fromEvent: Event.fromEvent,

            /**
             * 参考{@link Event#delegate}
             */
            delegate: Event.delegate
        };
    }
);
