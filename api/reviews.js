const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const reviews = require('../data/reviews');

const db = require('../lib/mysqlPool');
const { authenticate, requireAuthentication } = require('../lib/authorization');

exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};

async function userAlreadyReviewed(userid, businessid) {
  const [results] = await db.query(
    "SELECT * FROM reviews WHERE userid = ? AND businessid = ?",
    [userid, businessid]
  )

  return (results.length > 0);
}

async function insertUserReview(review) {
  const validatedReview = extractValidFields(
    review,
    reviewSchema
  );

  const [results] = await db.query(
    "INSERT INTO reviews SET ?", validatedReview);
  return results.insertId;
}

async function getReviewById(reviewid) {
  const [results] = await db.query(
    'SELECT * FROM reviews WHERE id = ?',[reviewid]);
  return results[0];
}

async function updateReviewById(reviewid, review) {
  const validatedReview = extractValidFields(
    review,
    reviewSchema
  );
  const [result] = await db.query(
    'UPDATE reviews SET ? WHERE id = ?',
    [validatedReview, reviewid]
  );
  return result.affectedRows > 0;
}

async function deleteReviewById(reviewid) {
  const [result] = await db.query(
    'DELETE FROM reviews WHERE id = ?',
    [reviewid]
  );
  return result.affectedRows > 0;
}

async function getUserFromReview(reviewid){
  const [result] = await db.query(
    'SELECT userid FROM reviews WHERE id = ?',
    [reviewid]
  ) 
  return results[0].userid;
}

/*
 * Route to create a new review.
 */
router.post('/', async function (req, res, next) {
  try {
    if (authenticate(req.body.userid, req)){ 
    const review = extractValidFields(req.body, reviewSchema);
    const userReviewed = await userAlreadyReviewed(review.userid, review.businessid);

    if (userReviewed) {
      res.status(403).json({
        error: "User has already posted a review of this business."
      });
    } else {
      id = await insertUserReview(req.body);
      res.status(201).json({
        id: id,
        links: {
          review: `/reviews/${id}`,
          business: `/businesses/${review.businessid}`
        }
      });
    }
  }
  } catch (err) {
    res.status(400).json({
      error: "Unable to insert review into db."
    })
  }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async function (req, res, next) {
  const reviewid = parseInt(req.params.reviewID);
  try {
    const review = await getReviewById(reviewid);
    if (review) {
      res.status(200).json(review);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).json({
      error: "Unable to retrieve review."
    });
  }
});

/*
 * Route to update a review.
 */
router.put('/:reviewID', requireAuthentication, async function (req, res, next) {
  const reviewid = parseInt(req.params.reviewID);

  if (validateAgainstSchema(req.body, reviewSchema)) {
    /*
      * Make sure the updated review has the same businessid and userid as
      * the existing review.
      */
    let updatedReview = extractValidFields(req.body, reviewSchema);
    let existingReview = await getReviewById(reviewid);
    if (updatedReview.reviewid === existingReview.reviewid && updatedReview.userid === existingReview.userid) {
      try {
        updateStatus = await updateReviewById(reviewid, req.body);
        if (updateStatus) {
          res.status(200).json({
            links: {
              review: `/reviews/${reviewid}`,
              business: `/businesses/${updatedReview.businessid}`
            }
          });
        } else {
          next();
        }
      } catch (err) {
        error: "Unable to update review."
      }
    } else {
      res.status(403).json({
        error: "Updated review cannot modify reviewid or userid"
      });
    }
  } else {
    res.status(400).json({
      error: "Request body is not a valid review object"
    });
  }
});

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async function (req, res, next) {
  const reviewid = parseInt(req.params.reviewID);
  try {
    userId = await getUserFromReview(reviewid);
    if (authenticate(userId, req)) {
      deleteStatus = await deleteReviewById(reviewid);
      if (deleteStatus) {
        res.status(204).end();
      } else {
        next();
      }
    } else {
      res.status(403).json({
        error: "Unauthorized to perform this action."
      });
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete review."
    })
  }
});