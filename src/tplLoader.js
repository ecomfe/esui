/**
 * 标签搜索控件
 * @file tplLoader.js
 * @author chuzhenyang(chuzhenyang@baidu.com)
 */

define(
    function (require) {
        var $ = require('jquery');

        return {
            load: function (resourceId, req, load) {
                $.get(req.toUrl(resourceId), function (data) {
                    load(data);
                });
            }
        };
    }
);