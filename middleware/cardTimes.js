var _ = require('lodash');
var moment = require('moment')

module.exports = function createCardTimer(config, leanKitLogin) {

    function getWeekdaysBetween(start, end) {
        var initial = moment(start);
        var weekdays = 0;
        while (initial.isBefore(end)) {
            if (initial.isoWeekday() < 5) {
                weekdays++;
            }
            initial.add(1, 'd');
        }
        return weekdays;
    }

    return function cardTimes(req, res, next) {
        var called = 0;
        var numberOfCards = 0;
        _.forEach(Object.keys(req.sizes), function (key) {
            if (key === '0') return;
            numberOfCards += req.sizes[key].length;
        });
        _.forEach(Object.keys(req.sizes), function (key) {
            if (key === '0') return;
            var sizes = req.sizes[key];
            _.forEach(sizes, function (size, i) {
                leanKitLogin.getClient().getCardHistory(config.boardId, size.Id, function (err, data) {
                    called++;
                    if (err) {
                        console.log('err', err)
                    }
                    var firstTimeWipped = _.chain(data)
                        .where({
                            ToLaneTitle: config.fromLane
                        })
                        .map(function (x) {
                            var parsableDateTime = x.DateTime.split(' at ').join(' ')
                            return {
                                Date: moment(parsableDateTime, 'DD/MM/YYYY hh:mm:ss a')
                            }
                        })
                        .sortBy('Date')
                        .pluck('Date')
                        .value()[0];
                    if (!firstTimeWipped) {
                        return;
                    }

                    var lastTimeDone = _.chain(data)
                        .where({
                            ToLaneTitle: config.toLane
                        })
                        .map(function (x) {
                            var parsableDateTime = x.DateTime.split(' at ').join(' ')
                            return {
                                Date: moment(parsableDateTime, 'DD/MM/YYYY hh:mm:ss a')
                            }
                        })
                        .sortByOrder('Date', 'desc')
                        .pluck('Date')
                        .value()[0];

                    var started = moment(firstTimeWipped)
                    var finished = moment(lastTimeDone)

                    var totalTime = getWeekdaysBetween(started, finished);
                    size.TimeInDays = totalTime;
                });
            })
        });
        console.log(numberOfCards)
        var interval = setInterval(function () {
            if (called === numberOfCards) {
                clearInterval(interval);
                next();
            }
            console.log('did', called, 'equal', numberOfCards);
        }, 1000);

    }
};