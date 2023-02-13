const DataUriParser = require('datauri/parser.js');
const path = require('path');


const getDataUri = (file) => {
    const parser = new DataUriParser();
    const extName = path.extname(file.originalname);
    const uri = parser.format(extName, file.buffer);
    return uri;
}


module.exports = {
    getDataUri
}
