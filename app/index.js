const url = require('url');
const http = require('http');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

const port = process.env.PORT || 8080;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudName = 'imaggg';
const nsfwFolder = 'renhang';
const compressPerc = 0.8;

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

const compressed = s => s * compressPerc | 0;
    
const apiResponse = (req, res, result) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Header': 'Origin, X-Requested-With, Content-Type, Accept'
    });
    
    res.end(JSON.stringify(result));
}

const getFolders = () => new Promise((resolve, reject) => {
    cloudinary.api.root_folders((err, result) => {
        if(err) {
            reject(err)
            return;
        }

        resolve(result.folders.map(f => f.name));
    });
});

const getAlbumThumb = folder => new Promise((resolve, reject) => {
    cloudinary.api.resources({
        prefix: folder, 
        max_results: 1, 
        resource_type: 'image',
        type: 'upload'
    }, (err, result) => {
        if(err) {
            reject(err);
            return;
        }

        resolve({
            name: folder,
            thumb: result.resources.length > 0
                ? result.resources[0].secure_url.replace('/image/upload/', '/image/upload/h_300/')
                : null
        });
    });
});

const getAlbums = (req, res) => new Promise((resolve, reject) => {
    getFolders()
    .then(folders => {
        return Promise.map(folders, folder => getAlbumThumb(folder));
    })
    .then(result => apiResponse(req, res, result))
    .catch(console.error)
});

const getPhotos = (req, res) => new Promise((resolve, reject) => {
    let search = `NOT folder=${nsfwFolder}/*`;

    if(req.qs.query.album) {
        search = 'folder=' + req.qs.query.album;
    }

    cloudinary.search
      .expression(search)
      .with_field('context')
      .with_field('tags')
      .max_results(500)
      .execute()
      .then(result => {
        let resp = result.resources.map(r => {
            return {
                id: r.public_id,
                format: r.format,
                ts: r.created_at,
                w: r.width,
                h: r.height,
                src: r.secure_url.replace('/image/upload/', '/image/upload/q_auto:good/'),
                thumb: r.secure_url.replace('/image/upload/', '/image/upload/h_500/'),
                tags: r.tags || [],
                context: r.context || null
            }
        });

        return apiResponse(req, res, resp);
    })
    .catch(err => {
        if(err) {
            res.writeHead(500);
            res.end();
        }
    });
});

const routes = {
    '/albums.json': getAlbums,
    '/photos.json': getPhotos,
    '/heroku-standup.png': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'image/gif' });
        res.end(new Buffer("R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", 'base64'));
    },
    '_': (req, res) => {
        res.writeHead(404);
        res.end();
    }
};

http.createServer((req, res) => {

    if(req.method == 'OPTIONS') {
        res.end(200);
        return;
    }

    if(req.method !== 'GET') {
        res.end(400);
        return;
    }

    let query = url.parse(req.url, true);
    let route = routes[query.pathname] || routes['_'];

    req.qs = query;

    return route(req, res);
})
.listen(port);