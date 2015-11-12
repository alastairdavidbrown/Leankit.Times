var leankit = require("leankit-client");

var client = null;
var boardId;


var login = function (req, res) {
    
        client = leankit.createClient(req.body.accountName, req.body.email, req.body.password);
        boardId = req.body.boardId;

}

var getClient = function (req, res)
{
    return client;
}

var getBoardId = function (req, res)
{
    return boardId;
}

module.exports.getClient = getClient;
module.exports.login = login;
module.exports.getBoardId = getBoardId;









