/**
 * 标签搜索控件
 * @file tplLoader.js
 * @author chuzhenyang(chuzhenyang@baidu.com)
 */

define(
    function (require) {
        var $ = require('jquery');
        var etpl = require('./helper/template').getTemplateEngine();

        return {
            load: function (resourceId, req, load) {
                $.get(req.toUrl(resourceId), function (data) {
                    etpl.compile(data);
                    load(data);
                });
            }
        };
    }
);
