var utils = require("../../utils/utils.js");
var checkURLParam = utils.checkURLParam;

module.exports.GET = async function (req, write, server, ctx, params) {
	var render = ctx.render;
	var user = ctx.user;
	var callPage = ctx.callPage;

	var db_emotes = server.db_emotes;
	var createCSRF = server.createCSRF;

	if (!user.superuser) {
		return await callPage("404");
	}

	var emotes = await db_emotes.all("SELECT id, name, date_created, mime, LENGTH(data) AS len FROM emotes");

	var csrftoken = createCSRF(user.id, 0);

	var data = {
		emotes,
		csrftoken
	};

	write(render("administrator_emotes.html", data));
}

module.exports.POST = async function (req, write, server, ctx) {
	var path = ctx.path;
	var post_data = ctx.post_data;
	var user = ctx.user;

	var db_emotes = server.db_emotes;
	var checkCSRF = server.checkCSRF;

	if (!user.superuser) return;

	if (!post_data.length) return;

	var csrftoken = req.headers["x-csrf-token"];
	if (!checkCSRF(csrftoken, user.id.toString(), 0)) {
		return write("CSRF verification failed");
	}

	var action = checkURLParam("/administrator/emotes/:action", path).action;
	switch (action) {
		case "upload":
			var len = post_data[0];
			var name = "";
			for (var i = 0; i < len; i++) {
				var byte = post_data[1 + i];
				if (!byte) continue;
				name += String.fromCharCode(byte);
			}
			if (!name) return write("NO_NAME");
			var namelen = name.length;

			var ex = await db_emotes.get("SELECT id FROM emotes WHERE name=?", name);
			if (ex) return write("NAME");

			var is_png = post_data[1 + namelen];
			var is_jpg = post_data[2 + namelen];
			var data = post_data.slice(3 + namelen);
			var mime = "application/octet-stream";
			if (is_png) {
				mime = "image/png";
			} else if (is_jpg) {
				mime = "image/jpeg";
			}

			await db_emotes.run("INSERT INTO emotes VALUES(null, ?, ?, ?, ?)", [name, Date.now(), mime, data]);

			write("DONE");
			break;
		case "delete":
			var name = post_data.toString();

			if (!name) return write("NO_NAME");

			var ex = await db_emotes.get("SELECT id FROM emotes WHERE name=?", name);
			if (!ex) return write("NO_ENT");

			await db_emotes.run("DELETE FROM emotes WHERE name=?", name);

			write("DONE");
			break;
	}
}