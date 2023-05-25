const jwt = require('jsonwebtoken');
const secretKey = "SuperSecret";

function generateAuthToken(userid, admin) {
    const payload = { sub: userid, admin: admin };
    return jwt.sign(payload, secretKey, { expiresIn: '24h' });
}

function requireAuthenticationParams(req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] == 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);
        req.user = payload.sub;
        req.admin = payload.admin;
        if (req.user != req.params.userid && !req.admin) {
            res.status(403).json({
                error: "Unauthorized to access the specified resource"
            })
        } else {
            next();
        }
    } catch (err) {
        res.status(401).json({
            error: "Invalid authentication token provided."
        });
    }
}

function requireAuthentication(req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] == 'Bearer' ? authHeaderParts[1] : null;
    try {
        const payload = jwt.verify(token, secretKey);
        next();
    } catch (err) {
        res.status(401).json({
            error: "Invalid authentication token provided."
        });
    }
}

function authenticate(userid, req) {
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] == 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);
        req.user = payload.sub;
        req.admin = payload.admin;
        if (req.user != userid && !req.admin) {
            return false;
        } else {
            return true;
        }
    } catch (err) {
        return false;
    }
}

function is_admin(req) {
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');

    const token = authHeaderParts[0] == 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);

        admin = payload.admin;

        return admin;
    } catch (err) {
        return false;
    }
}

exports.generateAuthToken = generateAuthToken;
exports.requireAuthenticationParams = requireAuthenticationParams;
exports.requireAuthentication = requireAuthentication;
exports.authenticate = authenticate;
exports.is_admin = is_admin;