/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
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
        var page = {};

        /**
         * 获取页面宽度
         *
         * @method module:page.getWidth
         *
         * @return {number} 页面宽度
         */
        page.getWidth = function () {
            return Math.max(
                documentElement.scrollWidth,
                body.scrollWidth,
                viewRoot.clientWidth
            );
        };

        /**
         * 获取页面高度
         *
         * @method module:page.getHeight
         *
         * @return {number} 页面高度
         */
        page.getHeight = function () {
            return Math.max(
                documentElement.scrollHeight,
                body.scrollHeight,
                viewRoot.clientHeight
            );
        };


        /**
         * 获取页面视觉区域宽度
         *
         * @method module:page.getViewWidth
         *
         * @return {number} 页面视觉区域宽度
         */
        page.getViewWidth = function () {
            return viewRoot.clientWidth;
        };

        /**
         * 获取页面视觉区域高度
         *
         * @method module:page.getViewHeight
         *
         * @return {number} 页面视觉区域高度
         */
        page.getViewHeight = function () {
            return viewRoot.clientHeight;
        };

        /**
         * 获取纵向滚动量
         *
         * @method module:page.getScrollTop
         *
         * @return {number} 纵向滚动量
         */
        page.getScrollTop = function () {
            return window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop;
        };

        /**
         * 获取横向滚动量
         *
         * @method module:page.getScrollLeft
         *
         * @return {number} 横向滚动量
         */
        page.getScrollLeft = function () {
            return window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft;
        };

        return { page: page };
    }
);
