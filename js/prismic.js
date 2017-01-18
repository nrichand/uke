var prismic = window.prismic || {};


(function (undefined) {

  var window = this;
  var document = window.document;

  // https://developer.mozilla.org/en-US/docs/DOM/document.cookie
  var customCookies = {

    getItem: function(sKey) {
      return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*\"?([^;]*)\"?.*$)|^.*$"), "$1")) || undefined;
    },

    setItem: function(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }
      var sExpires = "";
      if (vEnd) {
        switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
        }
      }
      document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
      return true;
    },

    removeItem: function (sKey, sPath, sDomain) {
      if (!customCookies.hasItem(sKey)) { return false; }
      var cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
      document.cookie = cookie;
      return true;
    },

    supportCookies: function() {
      // check that the browser supports setting cookies
      if (!window.navigator.cookieEnabled) return false;
      document.cookie = "__verify=1";
      var supportsCookies = document.cookie.length >= 1 && document.cookie.indexOf("__verify=1") !== -1;
      // now delete the cookie
      var thePast = new Date(2010, 1, 1);
      document.cookie = "__verify=1;expires=" + thePast.toUTCString();
      if (!supportsCookies) return false;
      return true;
    },

    hasItem: function (sKey) {
      if (!sKey) { return false; }
      return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    }

  };

  function loadJQuery(callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    var loaded = false;
    script.onload = script.onreadystatechange = function () {
      if(!loaded && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
        loaded = true;
        callback(window.jQuery.noConflict(true));
        script.onload = script.onreadystatechange = undefined;
        head.removeChild(script);
      }
    };
    script.src = '//code.jquery.com/jquery-2.1.1.min.js';
    head.appendChild(script);
  }

  var experimentCookieKey = 'io.prismic.experiment';
  var previewCookieKey = 'io.prismic.preview';

  function startExperiment(expId, cxApi) {
    try {
      if(!customCookies.getItem(previewCookieKey)) {
        if(!customCookies.supportCookies()) return;
        var storeVariationAndReload = function(variation) {
          customCookies.setItem(experimentCookieKey, [expId, variation].join(' '), 60 * 60 * 24 * 30, "/");
          window.location.reload();
        };

        var inCookie = (customCookies.getItem(experimentCookieKey) || '').split(' ');
        var googleVariation = cxApi.chooseVariation();
        if (googleVariation == cxApi.NOT_PARTICIPATING) {
          return;
        }
        if (inCookie[0] != expId || inCookie[1] != googleVariation) {
          storeVariationAndReload(googleVariation);
        }
      }
    } catch (e) {
      // cookies may be disabled, fail silently
    }
  }

  function showToolbar() {

    try {

      // Search for the preview token cookie
      var previewToken = customCookies.getItem(previewCookieKey);

      if (!previewToken && !prismic.endpoint) return;

      loadJQuery(function($) {

        // Fail fast, there is no preview available
        if(previewToken) {

          // Insert the preview bar
          var $iframe = $('body').append('<iframe id="io-prismic-toolbar" src="' + previewToken + '"></iframe>').find("iframe#io-prismic-toolbar");
          $iframe.css({
            'position': 'fixed',
            'bottom': '10px',
            'right': '20px',
            'height': '50px',
            'width': '100%',
            'border': 'none',
            'z-index': '2147483000',
            'opacity': '0'
          });

          // Remember some styles so we can easily restore them back after toggle
          var toolbarStyle, bodyStyle, htmlStyle;

          // Display the toolbar (invisible at first)
          function display(dimension) {
            toolbarStyle = $iframe.width(dimension.width).height(dimension.height).css('opacity', 1).attr('style');
            bodyStyle = $('body').attr('style') || '';
            htmlStyle = $('html').attr('style') || '';
          }

          // Toggle betweem bar mode and details mode
          function toggle(mode) {
            if(mode == 'detail') {
              $iframe.css({
                top: '0',
                left: '0',
                right: 'auto',
                bottom: 'auto',
                width: '100%',
                height: '100%'
              });
              $('body').css('overflow', 'hidden');
              $('html').css('overflow', 'hidden');
            } else {
              $iframe.attr('style', toolbarStyle);
              $('body').attr('style', bodyStyle);
              $('html').attr('style', htmlStyle);
            }
          }

          // Close the preview session (ie. discard the cookie)
          function closeSession() {
            var domainParts = document.location.hostname.split('.');
            var pathParts = document.location.pathname.split('/');
            var domain, path;

            for(var d=0; d<domainParts.length; d++) {
              domain = domainParts.slice(d).join('.');
              for(var p=0; p<pathParts.length; p++) {
                path = pathParts.slice(0, pathParts.length - p).join('/');
                customCookies.removeItem(previewCookieKey, path + '/', domain.indexOf('.') > -1 ? domain : '');
                customCookies.removeItem(previewCookieKey, path, domain.indexOf('.') > -1 ? domain : '');
              }
            }
          }

          // Reload the browser window (either on the same URL or on the given one)
          function reload(url) {
            if(url) {
              document.location = url;
            } else {
              document.location.reload();
            }
          }

          // Listen to prismic.io messages
          $(window).on('message', function(e) {
            var message = e.originalEvent.data;

            switch(message.type) {

            case 'io.prismic.display':
              display(message.data);
              break;

            case 'io.prismic.closeSession':
              closeSession();
              break;

            case 'io.prismic.reload':
              reload(message.data);
              break;

            case 'io.prismic.toggle':
              toggle(message.data);
              break;

            default:
              break;
            }
          });

        }

        if(prismic.endpoint) {

          var experimentToken = customCookies.getItem(experimentCookieKey);

          var icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpERjQ5QUU2RjNEMjA2ODExODhDNkNCNjMxRDc2RjgxMiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpDNEVBRjk1MDJGRjIxMUUyOEMwOTk5MjNGNzE3MTFBNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpDNEVBRjk0RjJGRjIxMUUyOEMwOTk5MjNGNzE3MTFBNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgTWFjaW50b3NoIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MTQ5NzEzQkEyNzIwNjgxMThGNjJCODhCQkREMUY0RkYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6REY0OUFFNkYzRDIwNjgxMTg4QzZDQjYzMUQ3NkY4MTIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5adgfzAAABo0lEQVR42uybz2YDURSHb/8oXfUBSrddlW7zBqWrvkEppWQbSrahDF2FMISsssq2tFSqpEofoJRW32C6LCG053Avd3VNJneRc87vx0fInTHfmTh3bsx1Tl+OiQHxTfwRFTElCv+d2uwQpZdOUfqxqrJHvNaQD8w0FWFZ+cDQsjyzII62hMvfE62Gx29avfMxH5blmV+JBehlkmfmUuf7SaYCfErtAdy8xxkKcCO5EXIRRivI8zR4KKXhnSfGlA0LcCtB/i264MvE2P6S8lP/CxIjH2gnjilqyj8TuxLlA50Vpkjx8nWK0NUuH+gmztXRLh/oJc7ZjhqeSvlAkTj3mXb5QF/qqi6HfPxfn1n5wGjdH3Byr+dFTnWQhzzkIQ95yEMe8pCHPOQhD3nIQx7ykIc85CEPechDfn1yZ1meL3BuVZ5zalmeM7Asz3m3LH9gWZ5zZVmeM7Ysz29VVFblOS3L8pxry/KcmWu232aiQZ4XPwtXf5cVv5h44hTtvEw9/lb+Ll8Q+05htn0B4rwQT8Sj/6w6G76JfREPXvzHGcq/AAMAq1GE9ggQGt8AAAAASUVORK5CYII=';

          var matches = prismic.endpoint.match(new RegExp("(https?://([^/]*))"));
          if (!matches) return;
          var baseURL = matches[1].replace(/\.cdn\.prismic\.io/, ".prismic.io");
          var target = matches[2].replace(/\.cdn\.prismic\.io/, ".prismic.io");
          $.ajax({
            url: baseURL + '/app/authenticated',
            xhrFields: {withCredentials: true},
            crossDomain: true
          }).then(function() {
            $('[data-wio-id]').each(function(index, el) {
              var $el = $(el);
              var documentId = $el.data('wio-id');
              var url = (function() {
                if(previewToken) {
                  return baseURL + "/app/documents/" + documentId + '/preview/' + encodeURIComponent(previewToken);
                } else if(experimentToken) {
                  var value = experimentToken.split(' ');
                  var experimentId = value[0];
                  var variationId = value[1];
                  return baseURL + "/app/documents/" + documentId + '/experiments/' + encodeURIComponent(experimentId) + '/variations/' + encodeURIComponent(variationId);
                } else {
                  return baseURL + "/app/documents/" + documentId + '/ref';
                }
              })();
              var $button = $('<a target="'+ target +'" class="wio-link" href="' + url +'"><img style="width:16px" src="' + icon +'"/></a>');
              $button.css('background', 'none').css('width', '16px');
              $el.prepend($button);
            });
          });
        }

      });

    } catch (e) {
      // ???
    }
  }

  showToolbar();

})();