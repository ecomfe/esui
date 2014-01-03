/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 页面相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var documentElement = document.documentElement;
        var body = document.body;
        var viewRoot = document.compatMode == 'BackCompat'
            ? body
            : documentElement;

        /**
         * @class lib.page
         * @singleton
         */
        var page = {};

        /**
         * 获取页面宽度
         *
         * @return {number} 页面宽度
         */
        page.getWidth = function () {
            return Math.max(
                (documentElement ? documentElement.scrollWidth : 0),
                (body ? body.scrollWidth : 0),
                (viewRoot ? viewRoot.clientWidth : 0),
                0
            );
        };

        /**
         * 获取页面高度
         *
         * @return {number} 页面高度
         */
        page.getHeight = function () {
            return Math.max(
                (documentElement ? documentElement.scrollHeight : 0),
                (body ? body.scrollHeight : 0),
                (viewRoot ? viewRoot.clientHeight : 0),
                0
            );
        };


        /**
         * 获取页面视觉区域宽度
         *
         * @return {number} 页面视觉区域宽度
         */
        page.getViewWidth = function () {
            return viewRoot ? viewRoot.clientWidth : 0;
        };

        /**
         * 获取页面视觉区域高度
         *
         * @return {number} 页面视觉区域高度
         */
        page.getViewHeight = function () {
            return viewRoot ? viewRoot.clientHeight : 0;
        };

        /**
         * 获取纵向滚动量
         *
         * @return {number} 纵向滚动量
         */
        page.getScrollTop = function () {
            return window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
        };

        /**
         * 获取横向滚动量
         *
         * @return {number} 横向滚动量
         */
        page.getScrollLeft = function () {
            return window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
        };

        /**
         * 获取页面纵向坐标
         *
         * @return {number}
         */
        page.getClientTop = function () {
            return document.documentElement.clientTop
                || document.body.clientTop
                || 0;
        };

        /**
         * 获取页面横向坐标
         *
         * @return {number}
         */
        page.getClientLeft = function () {
            return document.documentElement.clientLeft
                || document.body.clientLeft
                || 0;
        };

        return { page: page };
    }
);
