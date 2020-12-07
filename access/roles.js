// server/roles.js
const AccessControl = require("accesscontrol");
const ac = new AccessControl();

exports.roles = (function() {
ac.grant("member")
 .readOwn("profile")
 .updateOwn("profile")

ac.grant("librarian")
 .extend("member")
 .readAny("profile")

ac.grant("admin")
 .extend("librarian")
 .updateAny("profile")
 .deleteAny("profile")

return ac;
})();
