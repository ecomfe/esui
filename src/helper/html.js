/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 生成HTML相关的辅助方法
 * @author otakustay
 */
define(
    function (require) {
        /**
         * @override Helper
         */
        var helper = {};

        // 自闭合的标签列表
        var SELF_CLOSING_TAGS = {
            area: true, base: true, br: true, col: true,
            embed: true, hr: true, img: true, input: true, 
            keygen: true, link: true, meta: true, param: true, 
            source: true, track: true, wbr: true
        };

        /**
         * 获取部件的起始标签
         *
         * @param {string} part 部件名称
         * @param {string} nodeName 部件使用的元素类型
         * @return {string}
         */
        helper.getPartBeginTag = function (part, nodeName) {
            var html = '<' + nodeName + ' id="' + this.getId(part) + '" '
                + 'class="' + this.getPartClassName(part) + '">';
            return html;
        };

        /**
         * 获取部件的结束标签
         *
         * @param {string} part 部件名称
         * @param {string} nodeName 部件使用的元素类型
         * @return {string}
         */
        helper.getPartEndTag = function (part, nodeName) {
            var html = SELF_CLOSING_TAGS.hasOwnProperty(nodeName)
                ? ' />'
                : '</' + nodeName + '>';
            return html;
        };

        /**
         * 获取部件的HTML模板
         *
         * @param {string} part 部件名称
         * @param {string} nodeName 部件使用的元素类型
         * @return {string}
         */
        helper.getPartHTML = function (part, nodeName) {
            return this.getPartBeginTag(part, nodeName)
                + this.getPartEndTag(part, nodeName);
        };

        return helper;
    }
);