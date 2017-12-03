$(document).ready(function() {
          var MMG, grid;
          MMG = window.MMG;
          
          
          //YOU MUST DEFINE YOUR API_KEY!!!!
          
          // if you havn't got an api_key 
          // you can easily get it here: 
          // https://www.flickr.com/services/apps/create/
          
          var API_KEY = 'a09d90ee7c44372f978fd10a11e1ec03';
          
          
          
          if(!API_KEY || API_KEY === 'INSERT_YOUR_API_KEY_HERE') {
            alert('You must define your api_key!');
            throw new Error('You must define your api_key!');
          }
          
          /**
           * 
           * jsonParser gets JSON Flickr object and transforms it
           *
           * @param {Object} data - the json object that has been
           * received from an external source 
           * @return {Array} - an array of arrays: first element 
           * is an array of data, second one - metadata
           *
           */
          var jsonParser = function(data) {
            if(!data) throw new Error('no data');
            if(data.stat === 'fail') {
              if(data.message && _.isString(data.message)) throw new Error(data.message);
              else throw new Error('Unknown Error');
            }
            if(!data.photos) throw new Error('the json object may have error');
            
            // the array of data:
            var photos = _.map(data.photos.photo, function(item) {
        
              var PREFFERED_HEIGHT = 350;  // you can change the size here
        
              var id = item.id,
                  farm = item.farm,
                  owner = item.owner,
                  secret = item.secret,
                  server = item.server,
                  title = item.title,
                  date = item.datetaken.split(' ')[0],
                  owner_name = item.ownername,
                  media = item.media,
                  
                  hrefToPage = 'http://flickr.com/photos/' + owner + '/' + id + '/in/photostream',
                  
                  url_n = item.url_n,  // 320px
                  url_m = item.url_m,  // 500px
                  url_c = item.url_c,  // 640px
                  url_z = item.url_z,  // 800px
                  url_l = item.url_l,  // 1024px
        
                  width_n = item.width_n *1,
                  width_m = item.width_m *1,
                  width_c = item.width_c *1,
                  width_z = item.width_z *1,
                  width_l = item.width_l *1,
        
                  height_n = item.height_n *1,
                  height_m = item.height_m *1,
                  height_c = item.height_c *1,
                  height_z = item.height_z *1,
                  height_l = item.height_l *1;
        
                  var heights = [
                    ['url_n', height_n],
                    ['url_m', height_m],
                    ['url_z', height_z],
                    ['url_c', height_c],
                    ['url_l', height_l]
                  ];
        
                  var urls = {
                    url_n: url_n,
                    url_m: url_m,
                    url_z: url_z,
                    url_c: url_c,
                    url_l: url_l
                  };
        
              // all items must by of photo type
              if (media === 'video') return null;
        
              // looking for an icon url:
              var icon = urls[
                _.chain(heights)
        
                .filter(function(item){
                  if (_.isNaN(item[1])) return false;
                  return item[1] > PREFFERED_HEIGHT;
                })
        
                .min(function(item){
                  return item[1];
                })
        
                .value()[0]
              ];
        
              // looking for a big photo url:
              var showImage = (function(urls){
                if(urls.url_l && _.isString(urls.url_l)) return urls.url_l;
                if(urls.url_c && _.isString(urls.url_c)) return urls.url_c;
                if(urls.url_z && _.isString(urls.url_z)) return urls.url_z;
                if(urls.url_m && _.isString(urls.url_m)) return urls.url_m;
                if(urls.url_n && _.isString(urls.url_n)) return urls.url_n;
        
              })(urls);
        
              if(!icon) return false;
        
              return {
                title: title, //title
                topDescription: owner_name, //description
                src: icon, //a src of an icon
                href: showImage, //a href to a big image
                lb: { //lightbox
                  title: title, //a title
                  href: hrefToPage //the link to an external page
                }
              };
            });
        
        
            //metadata:
            var meta = {
              page: data.photos.page, //a page of pages
              pages: data.photos.pages, //number of pages
              perpage: data.photos.perpage, // how many photos are in one page
              total: data.photos.total //total number of photos
            };
        
            photos = _.filter(photos, function(item) {return item});
        
            return [photos, meta];
          };
        
        
          // the list of possible variables:
          var api_key = API_KEY,
              method = 'flickr.people.getPublicPhotos',
              user_id = '145417732@N05', //use it if you are looking for photos of a user
              gallery_id = null, // for a gallery
              tags = null, // a list of tags
              text = null, // if you are looking for some text
              per_page = 100, //photos per page
              extras = 'owner_name, media, url_n, url_m, url_c, url_z, url_l, date_taken',
              lat = null,
              lon = null,
              sort = null,
              radius = null;
              
              /*
                the list of possible params:
        
                'user_id',
                'photoset_id',
                'gallery_id',
                'tags',
                'tag_mode',
                'text',
                'sort',
                'min_upload_date',
                'max_upload_date',
                'min_taken_date',
                'max_taken_date',
                'content_type',
                'extras',
                'per_page',
                'page',
                'content_type',
                'has_geo',
                'geo_context',
                'lat',
                'lon' ,
                'radius',
                'km'
              
              */
              
              
              
          var page = 1,
              pages = 1,
              loaded = 0;
        
          var toUrl = function(o) {
             return  _.reduce(_.keys(o), function(memo, key) {
                if (o[key] == null) return memo;
                return memo + encodeURIComponent(key) + '=' + encodeURIComponent(o[key])+'&';
              }, '');
            };
        
        
          var params = {
              method: method,
              api_key: api_key,
              user_id: user_id,
              gallery_id: gallery_id,
              tags: tags,
              format: 'json',
              text: text,
              page: page,
              per_page: per_page,
              extras: extras,
              lat: lat,
              lon: lon,
              radius:radius
            };
        
          var urlBasic = 'https://api.flickr.com/services/rest/?';
          var urlEnd = 'jsoncallback=?';
        
        
          var url = urlBasic + toUrl(params) + urlEnd;
        
        
          var options = {
            retina: 0,
        
            timeout: 10000,
            grid: '#container', 
            url: url,
            jsonParser: jsonParser,
            lightbox: {
              retina: false,
              swipe: true
            }
          };
        
          var oneClick = function(event) {
        
            $(this).stop().animate(
            {
              opacity: 0.3
            });
        
            grid.loadByAjax(url);
        
          };
        
          grid = MMG.Gallery('Classica', options); 
        
          $('#container').on('dataLoaded', function() {
        
            $('#load a').css('opacity', 1).one('click', oneClick);
        
            var meta = grid.getLastLoadedMeta();
            page = meta.page * 1;
            pages = meta.pages * 1;
            if(page === pages) {
              $('#load a').remove();
              loaded = meta.total;
            }
            else loaded = page * per_page;
            page++;
            params.page = page;
            url = urlBasic + toUrl(params) + urlEnd;
        
            $('#loaded').html('loaded: ' + loaded);
          });
        });