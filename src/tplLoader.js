/**
 * 标签搜索控件
 * @file tplLoader.js
 * @author chuzhenyang(chuzhenyang@baidu.com)
 */

define(
    function (require) {
        var $ = require('jquery');
        var engine = require('./templateEngine').get();

        return {
            load: function (resourceId, req, load) {
                $.get(req.toUrl(resourceId), function (data) {
                    engine.compile(data);
                    load(data);
                });
            }
        };
    }
);
