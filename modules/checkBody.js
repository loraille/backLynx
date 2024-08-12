function checkBody(body, keys) {
  let isValid = true;
  // during tests to avoid crashes
  if(!body) {
    console.log("###NULL : req.files or req.body null");
     return false;
  }

  for (const field of keys) {
    if (!body[field] || body[field] === '') {
      isValid = false;
    }
  }

  return isValid;
}

module.exports = { checkBody };
