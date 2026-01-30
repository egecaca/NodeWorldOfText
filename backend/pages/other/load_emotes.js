var utils = require("../../utils/utils.js");
var checkURLParam = utils.checkURLParam;

module.exports.GET = async function(req, write, server, ctx) {
    var path = ctx.path;

    var db_emotes = server.db_emotes;

    var emote_name = checkURLParam("/other/emotes/:img", path).img;

    var data = await db_emotes.get("SELECT data, mime FROM emotes WHERE name=?", emote_name);

    if(!data) return write("Emote not found", 404);

    write(data.data, 200, { mime: data.mime_type });
}