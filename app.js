var ImagggApi = (function($) {

  var getApi = function() {
    return 'https://blooming-scrubland-29869.herokuapp.com/';
  }

  var getPhotos = function (options, cb) {

    if(typeof cb !== 'function') {
      cb = (function(){});
    }

    if(typeof options !== 'object') {
      options = {};
    }

    var endpoint = getApi() + 'photos.json';
    var album = options.album || '';
    var tags = '';

    if(options.tags && Array.isArray(options.tags)) {
      tags = options.tags.join(',');
    } else if(typeof options.tags == 'string') {
      tags = options.tags;
    }

    var endpoint = getApi() + 'photos.json?album=' + album + '&tags=' + tags;

    $.get(endpoint, function(data) {
      cb(data);
    });
  }

  return {
    photos: getPhotos
  }

})(jQuery);

var App = (function($) {
  var gallerySelector = '#imaggg-gallery';
  var galleryTagsSelector = '#imaggg-gallery-tags';
  var galleryPhotoSelector = '.imaggg-gallery-photo';
  var galleryConfig = {};

  var galleryFilteredPhotos = {};

  var pswpItems = [];
  var pswpElement = document.querySelectorAll('.pswp')[0];
  var pswpOptions = {
      index: 0
  };

  galleryConfig.album = $(gallerySelector).data('gallery-album');
  galleryConfig.tags = $(gallerySelector).data('gallery-tags');

  var photoContainer = function(options) {
    var tags = options.tags && Array.isArray(options.tags)
      ? options.tags.join(',')
      : '';

    return '<a href="#" class="imaggg-gallery-photo" data-id="' + options.id 
      + '" data-index="' + options.index 
      + '" data-tags="'  + tags
      + '"><img src="'   + options.thumb + '"/></a>'
  }

  var tagFilter = function(filter) {
    return function() {
      var tag = $(this).text();

      if($(this).attr('active')) {
        Object.keys(galleryFilteredPhotos).forEach(function(photo) {
          $(galleryFilteredPhotos[photo]).show('slow');
        });

        galleryFilteredPhotos = {};
        $(this).removeAttr('active');

        return;
      } else {
        filter
        .filter(function() {
          return $(this).text() !== tag;
        })
        .each(function() {
          $(this).removeAttr('active');
        });

        $(this).attr('active', 'true');
      }

      $(gallerySelector + '>a' + galleryPhotoSelector).each(function() {
        var photoTags = ($(this).data('tags') || '').toLowerCase();

        if(photoTags == '' || photoTags.indexOf(tag) == -1) {
          var photoId = $(this).data('id');

          galleryFilteredPhotos[photoId] = this;
          $(this).hide('slow');
        } else {
          $(this).show('slow');
        }
      });
    }
  }

  ImagggApi.photos(galleryConfig, function(photos) {
    var index = 0;

    photos.forEach(function(photo) {
      photo.index = index++;

      if(photo.context && photo.context.custom && photo.context.custom.alt) {
        photo.title = photo.context.custom.alt;
      }

      $(gallerySelector).append(photoContainer(photo));
      pswpItems.push(photo);
    });

    $(galleryPhotoSelector).click(function(event) {
      event.preventDefault();

      var imageId = $(this).data('id');
      var imageIndex = $(this).data('index');

      var gallery = new PhotoSwipe(
        pswpElement, 
        PhotoSwipeUI_Default, 
        pswpItems, 
        Object.assign(pswpOptions, { index: imageIndex })
      );

      gallery.init();
    });

    $('#loader').remove();
  });

  $(galleryTagsSelector + '>li').each((function() {
    $(this).bind('click', tagFilter($(galleryTagsSelector + '>li')));
  }));
})(jQuery);
