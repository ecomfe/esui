/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 日期相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var date = {};

        function pad(source, length) {
            var prefix = '';
            var negative = (source < 0);
            var string = Math.abs(source) + '';

            if (string.length < length) {
                prefix = (new Array(length - string.length + 1)).join('0');
            }

            return (negative ? '-' : '') + prefix + string;
        }

        /**
         * 对目标日期对象进行格式化
         *
         * 格式表达式，变量含义：
         *
         * - `hh`: 带 0 补齐的两位 12 进制时表示<br>
         * - `h`: 不带 0 补齐的 12 进制时表示<br>
         * - `HH`: 带 0 补齐的两位 24 进制时表示<br>
         * - `H`: 不带 0 补齐的 24 进制时表示<br>
         * - `mm`: 带 0 补齐两位分表示<br>
         * - `m`: 不带 0 补齐分表示<br>
         * - `ss`: 带 0 补齐两位秒表示<br>
         * - `s`: 不带 0 补齐秒表示<br>
         * - `YYYY`: 带 0 补齐的四位年表示<br>
         * - `YY`: 带 0 补齐的两位年表示<br>
         * - `MM`: 带 0 补齐的两位月表示<br>
         * - `M`: 不带 0 补齐的月表示<br>
         * - `DD`: 带 0 补齐的两位日表示<br>
         * - `D`: 不带 0 补齐的日表示
         *
         * @param {Date} source 目标日期对象
         * @param {string} pattern 日期格式化规则
         * @return {string} 格式化后的字符串
         */
        date.format = function (source, pattern) {
            if (!source) {
                return '';
            }

            source = source + '';

            var year = source.getFullYear();
            var month = source.getMonth() + 1;
            var date = source.getDate();
            var hours = source.getHours();
            var minutes = source.getMinutes();
            var seconds = source.getSeconds();

            var result = pattern
                .replace(/YYYY/g, pad(year, 4))
                .replace(/YY/g, pad(parseInt((year + '').slice(2), 10), 2))
                .replace(/MM/g, pad(month, 2))
                .replace(/M/g, month)
                .replace(/DD/g, pad(date, 2))
                .replace(/D/g, date)
                .replace(/HH/g, pad(hours, 2))
                .replace(/H/g, hours)
                .replace(/hh/g, pad(hours % 12, 2))
                .replace(/h/g, hours % 12)
                .replace(/mm/g, pad(minutes, 2))
                .replace(/m/g, minutes)
                .replace(/ss/g, pad(seconds, 2))
                .replace(/s/g, seconds);

            return result;
        };

        /**
         * 将目标字符串转换成日期对象
         *
         * 对于目标字符串，下面这些规则决定了 parse 方法能够成功地解析：
         *
         * - 短日期可以使用“/”或“-”作为日期分隔符，
         * 但是必须用月/日/年的格式来表示，例如"7/20/96"。
         * - 以 "July 10 1995" 形式表示的长日期中的年、月、日可以按任何顺序排列，
         * 年份值可以用 2 位数字表示也可以用 4 位数字表示。
         * 如果使用 2 位数字来表示年份，那么该年份必须大于或等于 70。
         * - 括号中的任何文本都被视为注释。这些括号可以嵌套使用。
         * - 逗号和空格被视为分隔符。允许使用多个分隔符。
         * - 月和日的名称必须具有两个或两个以上的字符。
         * 如果两个字符所组成的名称不是独一无二的，
         * 那么该名称就被解析成最后一个符合条件的月或日。
         * 例如，"Ju" 被解释为七月而不是六月。
         * - 在所提供的日期中，如果所指定的星期几的值与
         * 按照该日期中剩余部分所确定的星期几的值不符合，
         * 那么该指定值就会被忽略。
         * 例如，尽管 1996 年 11 月 9 日实际上是星期五，
         * "Tuesday November 9 1996" 也还是可以被接受并进行解析的。
         * 但是结果 date 对象中包含的是 "Friday November 9 1996"。
         * - JScript 处理所有的标准时区，
         * 以及全球标准时间 (UTC) 和格林威治标准时间 (GMT)。
         * - 小时、分钟、和秒钟之间用冒号分隔，
         * 尽管不是这三项都需要指明。"10:"、"10:11"、和 "10:11:12" 都是有效的。
         * - 如果使用 24 小时计时的时钟，
         * 那么为中午 12 点之后的时间指定"PM"是错误的。例如 "23:15 PM" 就是错误的。
         * - 包含无效日期的字符串是错误的。
         * 例如，一个包含有两个年份或两个月份的字符串就是错误的。
         *
         * @param {string} source 目标字符串
         * @return {Date} 转换后的日期对象
         */
        date.parse = function (source) {
            if (!source) {
                return new Date(0);
            }

            var reg = new RegExp('^\\d+(\\-|\\/)\\d+(\\-|\\/)\\d+\x24');
            if ('string' == typeof source) {
                if (reg.test(source) || isNaN(Date.parse(source))) {
                    var d = source.split(/ |T/);
                    var d1 = d.length > 1
                        ? d[1].split(/[^\d]/)
                        : [0, 0, 0];
                    var d0 = d[0].split(/[^\d]/);
                    return new Date(
                        d0[0] - 0, d0[1] - 1, d0[2] - 0,
                        d1[0] - 0, d1[1] - 0, d1[2] - 0
                    );
                }
                else {
                    return new Date(source);
                }
            }

            return new Date();
        };

        return { date: date };
    }
);
