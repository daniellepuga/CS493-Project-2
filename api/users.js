const router = require('express').Router();

exports.router = router;

const { businesses } = require('./businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

const db = require('../lib/mysqlPool');

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
    reviews: userReviews
  });
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', async function (req, res) {
  const userid = parseInt(req.params.userid);
  photos = await getPhotosByUser(userid);
  res.status(200).json({
    photos: userPhotos
  });
});
