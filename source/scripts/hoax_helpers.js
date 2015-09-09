(function(doc, win, objName) {
  var addEvent     = 'addEventListener',
      getByTag     = 'getElementsByTagName',
      qsa          = 'querySelectorAll',
      hoax_helpers = {};

  /**
   * Initialisation functions
   *
   * @return {Void}
   */
  function init() {
    fix_viewport();
  }

  /**
   * Fix the iOS viewport scaling bug
   *
   * @link   https://gist.github.com/mathiasbynens/901295
   * @author @mathias, @cheeaun and @jdalton
   * @return {Void}
   */
  function fix_viewport() {
    var type     = 'gesturestart',
        scales   = [1, 1],
        meta     = qsa in doc ? doc[qsa]('meta[name=viewport]') : [];

    function fix() {
      meta.content = 'width=device-width,minimum-scale=' + scales[0] + ',maximum-scale=' + scales[1];
      doc.removeEventListener(type, fix, true);
    }

    if ((meta = meta[meta.length - 1]) && addEvent in doc) {
      fix();
      scales = [0.25, 1.6];
      doc[addEvent](type, fix, true);
    }
  }

  /**
   * Fetch a script with a callback on success
   *
   * @link   http://stackoverflow.com/a/28002292/954798
   * @param  {Object} options {url: '', success: funciton() {}}
   * @return {Void}
   */
  hoax_helpers.get_script = function(options) {
    var script = doc.createElement('script');
    var prior  = doc[getByTag]('script')[0];
    script.async = 1;
    prior.parentNode.insertBefore(script, prior);

    script.onload = script.onreadystatechange = function(_, isAbort) {
      if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
        script.onload = script.onreadystatechange = null;
        script = undefined;

        if (!isAbort) {
          options.success();
        }
      }
    };

    script.src = options.url;
  };

  /**
   * Add class to element
   *
   * @link   http://youmightnotneedjquery.com/#add_class
   * @param  {Element} el        Element to get a new class
   * @param  {String}  className New class
   * @return {Void}
   */
  hoax_helpers.add_class = function(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else {
      el.className += ' ' + className;
    }
  };

  /**
   * Remove class from element
   *
   * @link   http://youmightnotneedjquery.com/#remove_class
   * @param  {Element} el        Element to loose a class
   * @param  {String}  className Class to be removed
   * @return {Void}
   */
  hoax_helpers.remove_class = function(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(
        new RegExp('(?:^|\\s)' + className + '(?!\\S)'),
        ''
      );
    }
  };

  /**
   * Does the element have specified class
   *
   * @link   http://youmightnotneedjquery.com/#has_class
   * @param  {Element} el        Element to be searched for class
   * @param  {String}  className Class to be searched for
   * @return {Boolean}
   */
  hoax_helpers.has_class = function(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
  };

  /**
   * What it says on the tin
   *
   * @link   http://davidwalsh.name/javascript-debounce-function
   * @param  {Function} func      Function to be debounced
   * @param  {Integer}  wait      How long to wait between calls
   * @param  {Boolean}  immediate Trigger the function on the leading edge,
   *                              instead of the trailing
   * @return {Void}
   */
  hoax_helpers.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  };

  /**
   * Google Font loader
   *
   * @param  {Array} font_families Which google fonts to load, format:
   *                               ['Lato:700:latin', 'Permanent+Marker::latin']
   * @return {Void}
   */
  hoax_helpers.load_google_fonts = function(font_families) {
    hoax_helpers.get_script({
      url:      'http://ajax.googleapis.com/ajax/libs/webfont/1.5.18/webfont.js',
      success: function() {
        win.WebFont.load({
          google: {
            families: font_families
          },
          timeout: 3000
        });
      }
    });

    // Being paranoid
    setTimeout(function() {
      if (!win.WebFont) {
        hoax_helpers.add_class(doc, 'wf-inactive');
      }
    }, 2000);
  };

  /**
   * Google Analytics loader
   *
   * @param  {String} uid Google analytics ID
   * @return {Void}
   */
  hoax_helpers.load_google_analytics = function(uid) {
    hoax_helpers.get_script({
      url:     'http://www.google-analytics.com/ga.js',
      success: function() {
        try {
          var t;
          if (!(win._gat && win._gat._getTracker)) {
            throw 'Tracker has not been defined';
          }
          t = win._gat._getTracker(uid);
          t._trackPageview();
        } catch(e) {}
      }
    });
  };

  /**
   * Simple email obfuscator
   *
   * Replaces href attribute contents of: john at_string domain_string with
   * john@example.com if window.location.host is example.com.
   *
   * @param  {String} at_string     Google analytics ID
   * @param  {String} domain_string Google analytics ID
   * @return {Void}
   */
  hoax_helpers.fix_mailto_links = function(at_string, domain_string) {
    var links = doc[getByTag]('a');
    at_string = ' ' + at_string + ' ';
    for (var i = 0; i < links.length; i++) {
      if (links[i].href.indexOf(at_string) !== -1) {
        links[i].href = links[i].href.replace(at_string, '@');
        links[i].href = links[i].href.replace(domain_string, win.location.host);
      }
    }
  };

  /**
   * Make flexbox behave like a grid
   *
   * If the last "line" of a flexbox has uneven number of elements, it will not
   * appear as a grid - the elements will be centered on the line. This adds a
   * dud-like element with no dimensions, to make the grid align to the left.
   * This is a bad, and simplistic solution.
   *
   * @param  {Element} el        Parent element of the flexbox
   * @param  {String}  childType Type of flex child element to be added,
   *                             defaults to 'li'
   * @return {Void}
   */
  hoax_helpers.fix_flex = function(el, childType) {
    var dud = doc.createElement(childType || 'li');
    dud.style.height  = '0px';
    dud.style.padding = '0px';
    el.appendChild(dud);
  };


  /**
   * Document ready drop-in
   *
   * Slightly modified by Brego to minify better, and fit the coding style.
   *
   * @link   https://github.com/jfriend00/docReady
   * @author @jfriend00
   * @param  {Function} callback Function to be called on document ready event
   * @param  {Mixed}    context  Will be passed to the function as the first
   *                             argument
   * @return {Void}
   */
  hoax_helpers.document_ready = function(callback, context) {
    var readyList                   = [],
        readyFired                  = false,
        readyEventHandlersInstalled = false;

    function ready() {
      if (!readyFired) {
        readyFired = true;
        for (var i = 0; i < readyList.length; i++) {
          readyList[i].fn.call(win, readyList[i].ctx);
        }
        readyList = [];
      }
    }

    function readyStateChange() {
      if (doc.readyState == "complete") {
        ready();
      }
    }

    if (readyFired) {
      setTimeout(function() { callback(context); }, 1);
      return;
    } else {
      readyList.push({
        fn: callback,
        ctx: context
      });
    }
    if (doc.readyState === "complete" || (!doc.attachEvent && doc.readyState === "interactive")) {
      setTimeout(ready, 1);
    } else if (!readyEventHandlersInstalled) {
      if (doc[addEvent]) {
        doc[addEvent]("DOMContentLoaded", ready, false);
        win[addEvent]("load", ready, false);
      } else {
        doc.attachEvent("onreadystatechange", readyStateChange);
        win.attachEvent("onload", ready);
      }
      readyEventHandlersInstalled = true;
    }
  };

  init();

  win[objName] = hoax_helpers;

} (document, window, 'hoax_helpers'));
