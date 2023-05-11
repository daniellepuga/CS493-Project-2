const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

// const photos = require('../data/photos');

const db = require('../lib/mysqlPool');

exports.router = router;
// exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};
async function insertNewPhoto(photo) {
  const validatedPhotos = extractValidFields(
    photo,
    photoSchema
  );

  const [result] = await db.query(
    'INSERT INTO photos SET ?',
    validatedPhotos
  );

  return result.insertId;
}

async function getPhotoById(photoid) {
  const [results] = await db.query(
    'SELECT * FROM photos WHERE id = ?',
    [photoid]
  );

  return results[0];
}

async function updatePhotoById(photoid, photo) {
  const validatedPhotos = extractValidFields(
    photo,
    photoSchema
  );
  const [result] = await db.query(
    'UPDATE photos SET ? WHERE id = ?',
    [validatedPhotos, photoid]
  );
  return result.affectedRows > 0;
}

async function deletePhotoById(photoid) {
  const [result] = await db.query(
    'DELETE FROM photos WHERE id = ?',
    [photoid]
  );
  return result.affectedRows > 0;
}

/*
 * Route to create a new photo.
 */
router.post('/', async function (req, res, next) {
  try {
    const id = await insertNewPhoto(req.body);
    const photo = extractValidFields(req.body, photoSchema);

    res.status(201).json({
      id: id,
      links: {
        photo: `/photos/${id}`,
        business: `/businesses/${photo.businessid}`
      }
    })
  } catch (err) {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async function (req, res, next) {
  const photoid = parseInt(req.params.photoID);
  try {
    const photo = await getPhotoById(photoid);
    if (photo) {
      res.status(200).json(photo);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).json({
      error: "Unable to retrieve photo."
    });
  }
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', async function (req, res, next) {
  const photoid = parseInt(req.params.photoID);

  if (validateAgainstSchema(req.body, photoSchema)) {
    /*
      * Make sure the updated photo has the same businessid and userid as
      * the existing photo.
      */
    let updatedPhoto = extractValidFields(req.body, photoSchema);
    let existingPhoto = await getPhotoById(photoid);
    if (updatedPhoto.photoid === existingPhoto.photoid && updatedPhoto.userid === existingPhoto.userid) {
      try {
        updateStatus = await updatePhotoById(photoid, req.body);
        if (updateStatus) {
          res.status(200).json({
            links: {
              photo: `/photos/${photoid}`,
              business: `/businesses/${updatedPhoto.businessid}`
            }
          });
        } else {
          next();
        }
      } catch (err) {
        error: "Unable to update photo."
      }
    } else {
      res.status(403).json({
        error: "Updated photo cannot modify photoid or userid"
      });
    }
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async function (req, res, next) {
  const photoid = parseInt(req.params.photoID);
  try {
    deleteStatus = await deletePhotoById(photoid);
    if (deleteStatus) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete photo."
    })
  }
});