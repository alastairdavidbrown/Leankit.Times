var _ = require('lodash');
var moment = require('moment')

module.exports = function create(config, leanKitLogin) {
    return function (req, res, next) {
        var called = 0;
        var numberOfCards = req.features.length;
        _.forEach(req.features, function (feature) {
            leanKitLogin.getClient().getCardHistory(config.boardId, feature.Id, function (err, data) {
                called++;
                if (err) {
                    console.log('err', err)
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

                var finished = moment(lastTimeDone)

                feature.LastTimeDone = finished;
            });
        });

        var interval = setInterval(function () {
            console.log("did", called, "equal", numberOfCards)
            if (numberOfCards === 0) {
                console.log('no numberOfCards')
            }
            if (called === numberOfCards) {
                clearInterval(interval);
                next();
            }
        }, 1000);
    }
}