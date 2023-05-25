const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { extractValidFields } = require('../lib/validation');
const { generateAuthToken, requireAuthenticationParams, is_admin } = require('../lib/authorization');

exports.router = router;

// const { businesses } = require('./businesses');
// const { reviews } = require('./reviews');
// const { photos } = require('./photos');

const db = require('../lib/mysqlPool');
const { reviews } = require('./reviews');

const userSchema = {
  name: {required: true},
 email: {required: true},
  password: {required: true},
  admin: {required: true}
};

async function insertNewUser(user) {
  const validatedUser = extractValidFields(user, userSchema);

  validatedUser.password = await bcrypt.hash(validatedUser.password, 8);
  console.log(validatedUser);
  const [results] = await db.query(
    "INSERT INTO users SET ?", validatedUser);
   return results.insertId;
}

async function validateUser(email, password){
  const [results] = await db.query(
    "SELECT password FROM users WHERE email = ?", email);
  try{
    authenticatedUser = await bcrypt.compare(password, results[0].password);
    return authenticatedUser;
  } catch (err) {
    return false;
  }
}

async function getUserByEmail(email) {
  const [results] = await db.query(
    "SELECT id, admin FROM users WHERE email = ?", email);
}

async function getUserByID(userid){
  const [results] = await db.query(
    "SELECT name, email, admin FROM users WHERE id = ?", userid);
  return results[0];
}


async function getBusinessByUser(userid) {
  const [results] = await db.query(
    "SELECT * FROM businesses WHERE ownerid = ?",
    [userid]
  );

  return results;
}

async function getReviewsByUser(userid) {
  const [results] = await db.query(
    "SELECT * FROM reviews WHERE userid = ?",
    [userid]
  );

  return results;
}

async function getPhotosByUser(userid) {
  const [results] = await db.query(
    "SELECT * FROM photos WHERE userid = ?",
    [userid]
  );

  return results;
}

/*
 * Route to get user id
 */
router.get('/:userid', requireAuthenticationParams, async function (req, res, next) {
  const userid = parseInt(req.params.userid);
  user = await getUserByID(userid);
  if (user) {
    res.status(200).json({
      user: user
    });
  } else {
    next();
  }
});

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userid/businesses', async function (req, res) {
  const userid = parseInt(req.params.userid);
  businesses = await getBusinessByUser(userid);
  res.status(200).json({
    businesses: businesses
  });
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', async function (req, res) {
  const userid = parseInt(req.params.userid);
  reviews = await getReviewsByUser(userid);
  res.status(200).json({
    reviews: reviews
  });
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', async function (req, res) {
  const userid = parseInt(req.params.userid);
  photos = await getPhotosByUser(userid);
  res.status(200).json({
    photos: photos
  });
});

/*
 * Route to insert a new user
 */
router.post('/', async function (req, res, next) {
  try {
    if (!req.body.admin || (req.body.admin && is_admin(req))) {
      id = await insertNewUser(req.body);
      res.status(201).json({
        id: id,
        links: {
          review: `/${id}/reviews`,
          photos: `/${id}/photos`,
          businesses: `/${id}/businesses`
        }
      });
    } else {
      console.log(is_admin(req));
      res.status(403).json({
        error: "New admin not created."
      });
    }

  } catch (err) {
    res.status(400).json({
      error: "New user not created."
    });
  }
});

/*
 * Route to login
 */
router.post('/login', async function (req, res) {
  try {
    if (req.body && req.body.email && req.body.password) {
      if (validateUser(req.body.email, req.body.password)) {
        user = await getUserByEmail(req.body.email);
        console.log(`id: ${user.id}`);

        res.status(200).json({
          token: generateAuthToken(user.id, user.admin)
        });
      } else {
        res.status(401).json({
          error: "Incorrect email or password"
        });
      }
    } else {
      res.status(400).json({
        error: "Body needs both email and password"
      });
    }
  } catch (err) {
    res.status(400).json({
      error: "Could not log in."
    });
  }
});