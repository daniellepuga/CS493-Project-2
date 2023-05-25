const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const { requireAuthentication, authenticate } = require('../lib/authorization');

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

async function getUserFromPhoto(photoid) {
  const [result] = await db.query(
    'SELECT userid FROM photos WHERE id = ?', [photoid]
  )
}

/*
 * Route to create a new photo.
 */
router.post('/', requireAuthentication, async function (req, res, next) {
  try {
    if(authenticate(req.body.userid, req)){
    const id = await insertNewPhoto(req.body);
    const photo = extractValidFields(req.body, photoSchema);

    res.status(201).json({
      id: id,
      links: {
        photo: `/photos/${id}`,
        business: `/businesses/${photo.businessid}`
      }
    })
  } else {
    res.status(403).json({
      error: "Unable to add photo to database."
    });
    }
  }
  catch (err) {
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
    userid = await getUserFromPhoto(photoid);

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
router.delete('/:photoID', requireAuthentication, async function (req, res, next) {
  const photoid = parseInt(req.params.photoID);
  try {
    userid = await getUserFromPhoto(photoid);
    if(authenticate(userid, req)) {
    deleteStatus = await deletePhotoById(photoid);
    if (deleteStatus) {
      res.status(204).end();
    } else {
      next();
    }
  } else {
    res.status(403).json({
      error: "Cannot perform this action."
    });
  }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete photo."
    })
  }
});