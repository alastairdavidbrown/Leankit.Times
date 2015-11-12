var express = require('express');
var router = express.Router();
var _ = require('lodash');
var leanKitLogin = require('../middleware/leanKitLogin');
var config = require('../config/config');


module.exports = function (leanKitLogin, featureCards, splitSizes, cardTimes, lastTimeDone, groupByWeek, averageSizes, removeZeroSizes) {

    /* GET home page. */
    router.get('/showAverageCardTimes',
        featureCards,
        splitSizes,
        cardTimes,
        function (req, res) {
            var sizeData = [];
            _.forEach(Object.keys(req.sizes), function (key) {
                var sizes = req.sizes[key];
                var dataForThisSize = {
                    size: key,
                    biggestTime: 0,
                    totalTime: 0,
                    averageTime: 0,
                    numberOfCards: 0
                }
                _.forEach(sizes, function (size) {
                    if (!size.TimeInDays) {
                        return;
                    }
                    dataForThisSize.numberOfCards++;
                    dataForThisSize.totalTime += parseInt(size.TimeInDays);
                    if (size.TimeInDays > dataForThisSize.biggestTime) {
                        dataForThisSize.biggestTime = size.TimeInDays;
                    }
                })
                dataForThisSize.averageTime = Math.round(dataForThisSize.totalTime / sizes.length);
                sizeData.push(dataForThisSize);
            });

            res.render('index', {
                title: 'Ticket Times',
                ticketData: sizeData
            });
        });
    /* GET home page. */
    router.get('/averageTicketSize',
        featureCards,
        removeZeroSizes,
        lastTimeDone,
        groupByWeek,
        averageSizes,
        function (req, res) {
            var sizeData = []
            res.render('sizes', {
                title: 'Ticket Sizes',
                ticketData: req.averageSizes
            });
        });

    router.get(['/login', '/'], function (req,res) {
        res.render('leankit-login.ejs');
    });

    router.post('/login', function (req,res) {
        leanKitLogin.login(req,res);
        
        leanKitLogin.getClient().getBoards(function(err, boards){
                    res.render('leankit-select-board.ejs', {boards: boards });
        });
    });

    
    router.get('/leankit-set-ft-lane/:boardId/:fromLane?/:toLane?', function (req, res) {
        // Get the leankit lanes and pass them to the lane selector

        leanKitLogin.getClient().getBoard(req.params.boardId, function( err, board ) {
            
            
                // for every lane
                for(var i=0; i < board.Lanes.length; i++){
                    var fqLane = {Title: "", Depth: 0} 
                    // build get the lanes full name including parent, parents parent, etc (recurse) 
                    fqLane.Title = board.Lanes[i].Title;
                    getParentLaneTitleById(board.Lanes[i].ParentLaneId, board.Lanes, fqLane);
                    board.Lanes[i].fqTitle = fqLane.Title;
                }
                
				res.render('leankit-select-from-to-lane.ejs', { boardId: req.params.boardId, 
                                                                lanes: board.Lanes, 
                                                                fromLane: req.params.fromLane,
                                                                toLane: req.params.toLane,
                                                              })
                res.end();
			});
    });
    
    router.post('/leankit-set-ft-lane/:boardId/:fromLane?/:toLane', function (req,res) {
        console.log("Posting");
        // Set the config and call the route 
        config.boardId = req.params.boardId
        config.fromLane = req.params.fromLane
        config.toLane = req.params.toLane
        
        res.redirect('/showAverageCardTimes');
        
            
            
    });

    return router;
    
}

function getParentLaneTitleById(id, lanes, fqLane){

    console.log("Looking for the parent with id:" + id)
    console.log("getParentLaneTitleById:fqLaneTitle: " + fqLane.Title)

    for(var i=0; i<lanes.length; i++){
        if(lanes[i].Id == id){
            console.log("Found the parent:" + lanes[i].Title)
            titleChild  = fqLane.Title;
            fqLane.Title = lanes[i].Title + ": " + titleChild
            console.log("getParentLaneTitleById:fqLaneTitle: " + fqLane.Title)
            if (lanes.ParentLaneId != 0)    // if this lane has a parentrecurse
                getParentLaneTitleById(lanes.ParentLaneId, lanes, fqLane)
            return true;
        }
            
    }
    return null;
}


