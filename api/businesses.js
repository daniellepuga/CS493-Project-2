const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

// const businesses = require('../data/businesses');
// const { reviews } = require('./reviews');
// const { photos } = require('./photos');

const db = require('../lib/mysqlPool');

exports.router = router;
// exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

async function getBusinessesCount(){
  const[results] = await db.query(
    "SELECT COUNT(*) AS count FROM businesses"
  );
}

async function getBusinessesPage(page){
  const count = await getBusinessesCount();
  const numPerPage = 10;
  const lastPage = Math.ceil(count / numPerPage);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;

  const offset = (page - 1) * numPerPage;

  const [results] = await db.query(
    'SELECT * FROM businesses ORDER BY id LIMIT ?, ?',
    [offset, numPerPage]
  );
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/businesses?page=${page + 1}`;
    links.lastPage = `/businesses?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/businesses?page=${page - 1}`;
    links.firstPage = '/businesses?page=1';
  }

  return {
    businesses: results,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: count,
    links: links
  };
}

async function insertNewBusiness(business) {
  const validatedBusinesses = extractValidFields(
    business,
    businessSchema
  );

  const [result] = await db.query(
    'INSERT INTO businesses SET ?',
    validatedBusinesses
  );

  return result.insertId;
}

async function getBusinessById(businessId) {
  const [results] = await db.query(
    'SELECT * FROM businesses WHERE id = ?',
    [businessId]
  );

  return results[0];
}

async function updateBusinessById(businessId, business) {
  const validatedBusinesses = extractValidFields(
    business,
    businessSchema
  );

  const [result] = await db.query(
    'UPDATE businesses SET ? WHERE id = ?',
    [validatedBusinesses, businessId]
  );

  return result.affectedRows > 0;
}

async function deleteBusinessById(businessId) {
  const [result] = await db.query(
    'DELETE FROM businesses WHERE id = ?',
    [businessId]
  );
  return result.affectedRows > 0;
}


/*
 * Route to return a list of businesses.
 */
router.get('/', async function (req, res) {

  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  let page = parseInt(req.query.page) || 1;

  try {
  const businessPage = await getBusinessesPage(page);
  res.status(200).json(businessPage);
  } catch (err) {
    res.status(500).json({
      error: "Error fetching business list. Try again later."
    })
  }
});


  // const numPerPage = 10;
  // const lastPage = Math.ceil(businesses.length / numPerPage);
  // page = page > lastPage ? lastPage : page;
  // page = page < 1 ? 1 : page;

  // /*
  //  * Calculate starting and ending indices of businesses on requested page and
  //  * slice out the corresponsing sub-array of busibesses.
  //  */
  // const start = (page - 1) * numPerPage;
  // const end = start + numPerPage;
  // const pageBusinesses = businesses.slice(start, end);

  // /*
  //  * Generate HATEOAS links for surrounding pages.
  //  */
  // const links = {};
  // if (page < lastPage) {
  //   links.nextPage = `/businesses?page=${page + 1}`;
  //   links.lastPage = `/businesses?page=${lastPage}`;
  // }
  // if (page > 1) {
  //   links.prevPage = `/businesses?page=${page - 1}`;
  //   links.firstPage = '/businesses?page=1';
  // }

  // /*
  //  * Construct and send response.
  //  */
  // res.status(200).json({
  //   businesses: pageBusinesses,
  //   pageNumber: page,
  //   totalPages: lastPage,
  //   pageSize: numPerPage,
  //   totalCount: businesses.length,
  //   links: links
  // });

/*
 * Route to create a new business.
 */
router.post('/', async function (req, res, next) {
  try {
    const id = await insertNewBusiness(req.body);
    res.status(201).json({
      id: id,
      links: {
        business: `/businesses/${id}`
      }
    });
  } catch (err) {
    res.status(400).json({
      error: "Unable to insert business into db."
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  try {
    const business = await getBusinessById(businessid);
    if (business) {
      res.status(200).json(business);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).json({
      error: "Unable to retrieve business."
    });
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);

  try {
    const updateStatus = await updateBusinessById(businessid, req.body);
    if (updateStatus) {
      res.status(200).json({
        links: {
          business: `/businesses/${businessid}`
        }
      })
    } else {
      next();
    }
  } catch (err) {
    res.status(500).json({
      error: "Unable to update business."
    });
  }
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  try {
    deleteStatus = await deleteBusinessById(businessid);
    if (deleteStatus) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete business."
    })
  }
});